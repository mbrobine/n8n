import type { IExecuteFunctions, INode, INodeExecutionData } from 'n8n-workflow';

import { router } from '../../../v2/actions/router';
import * as sheet from '../../../v2/actions/sheet/Sheet.resource';
import * as spreadsheet from '../../../v2/actions/spreadsheet/SpreadSheet.resource';
import { resolveSheet } from '../../../v2/actions/utils/resolveSheet';
import { GoogleSheet } from '../../../v2/helpers/GoogleSheet';
import { getSpreadsheetId } from '../../../v2/helpers/GoogleSheets.utils';

jest.mock('../../../v2/helpers/GoogleSheet');
jest.mock('../../../v2/actions/sheet/Sheet.resource', () => ({
	append: { execute: jest.fn() },
	appendOrUpdate: { execute: jest.fn() },
	clear: { execute: jest.fn() },
	create: { execute: jest.fn() },
	delete: { execute: jest.fn() },
	read: { execute: jest.fn() },
	remove: { execute: jest.fn() },
	update: { execute: jest.fn() },
}));
jest.mock('../../../v2/actions/spreadsheet/SpreadSheet.resource', () => ({
	create: { execute: jest.fn() },
	deleteSpreadsheet: { execute: jest.fn() },
}));
jest.mock('../../../v2/helpers/GoogleSheets.utils');
jest.mock('../../../v2/actions/utils/resolveSheet');

describe('router', () => {
	let mockExecuteFunctions: Partial<IExecuteFunctions>;
	let mockNode: INode;
	let mockInputData: INodeExecutionData[];

	beforeEach(() => {
		mockNode = {
			id: '1',
			name: 'Google Sheets',
			typeVersion: 4.4,
			type: 'n8n-nodes-base.googleSheets',
			position: [60, 760],
			parameters: {},
		};

		mockInputData = [
			{ json: { id: 1, name: 'Item 1' }, pairedItem: { item: 0 } },
			{ json: { id: 2, name: 'Item 2' }, pairedItem: { item: 1 } },
			{ json: { id: 3, name: 'Item 3' }, pairedItem: { item: 2 } },
		];

		mockExecuteFunctions = {
			getNodeParameter: jest.fn(),
			getNode: jest.fn().mockReturnValue(mockNode),
			getInputData: jest.fn().mockReturnValue(mockInputData),
			continueOnFail: jest.fn().mockReturnValue(false),
		};

		jest.clearAllMocks();
	});

	describe('spreadsheet resource', () => {
		beforeEach(() => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('spreadsheet') // resource
				.mockReturnValueOnce('create'); // operation
		});

		it('should execute spreadsheet operations', async () => {
			const mockSpreadsheetResult = [{ json: { id: 'new-spreadsheet' } }];
			(spreadsheet.create.execute as jest.Mock).mockResolvedValue(mockSpreadsheetResult);

			const result = await router.call(mockExecuteFunctions as IExecuteFunctions);

			expect(spreadsheet.create.execute).toHaveBeenCalledWith();
			expect(result).toEqual([mockSpreadsheetResult]);
		});
	});

	describe('sheet resource - basic functionality', () => {
		beforeEach(() => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('sheet') // resource
				.mockReturnValueOnce('append') // operation
				.mockReturnValueOnce({ mode: 'id', value: 'test-spreadsheet-id' }); // documentId

			(getSpreadsheetId as jest.Mock).mockReturnValue('test-spreadsheet-id');
			(GoogleSheet as jest.Mock).mockImplementation(() => ({
				id: 'test-spreadsheet-id',
			}));
		});

		it('should create GoogleSheet instance with correct spreadsheet ID', async () => {
			(resolveSheet as jest.Mock).mockResolvedValue({ sheetId: '123', sheetName: 'Sheet1' });
			(sheet.append.execute as jest.Mock).mockResolvedValue([]);

			await router.call(mockExecuteFunctions as IExecuteFunctions);

			expect(getSpreadsheetId).toHaveBeenCalledWith(mockNode, 'id', 'test-spreadsheet-id');
			expect(GoogleSheet).toHaveBeenCalledWith('test-spreadsheet-id', mockExecuteFunctions);
		});

		it('should call resolveSheet for each input item', async () => {
			(resolveSheet as jest.Mock).mockResolvedValue({ sheetId: '123', sheetName: 'Sheet1' });
			(sheet.append.execute as jest.Mock).mockResolvedValue([]);

			await router.call(mockExecuteFunctions as IExecuteFunctions);

			expect(resolveSheet).toHaveBeenCalledTimes(3);
			expect(resolveSheet).toHaveBeenNthCalledWith(
				1,
				expect.any(Object), // GoogleSheet instance
				'append',
				0,
			);
			expect(resolveSheet).toHaveBeenNthCalledWith(2, expect.any(Object), 'append', 1);
			expect(resolveSheet).toHaveBeenNthCalledWith(3, expect.any(Object), 'append', 2);
		});
	});

	describe('sheet resource - batching logic by sheetId', () => {
		beforeEach(() => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('sheet') // resource
				.mockReturnValueOnce('append') // operation
				.mockReturnValueOnce({ mode: 'id', value: 'test-spreadsheet-id' }); // documentId

			(getSpreadsheetId as jest.Mock).mockReturnValue('test-spreadsheet-id');
			(GoogleSheet as jest.Mock).mockImplementation(() => ({
				id: 'test-spreadsheet-id',
			}));
		});

		it('should batch items with the same sheetId together', async () => {
			(resolveSheet as jest.Mock).mockResolvedValue({ sheetId: '123', sheetName: 'Sheet1' });

			const mockSheetResult = [
				{ json: { result: 'item1' } },
				{ json: { result: 'item2' } },
				{ json: { result: 'item3' } },
			];
			(sheet.append.execute as jest.Mock).mockResolvedValue(mockSheetResult);

			const result = await router.call(mockExecuteFunctions as IExecuteFunctions);

			expect(sheet.append.execute).toHaveBeenCalledTimes(1);
			expect(sheet.append.execute).toHaveBeenCalledWith(expect.any(Object), 'Sheet1', '123', [
				{ index: 0, data: mockInputData[0] },
				{ index: 1, data: mockInputData[1] },
				{ index: 2, data: mockInputData[2] },
			]);

			expect(result).toEqual([mockSheetResult]);
		});

		it('should create separate batches for different sheetIds', async () => {
			(resolveSheet as jest.Mock)
				.mockResolvedValueOnce({ sheetId: '123', sheetName: 'Sheet1' })
				.mockResolvedValueOnce({ sheetId: '456', sheetName: 'Sheet2' })
				.mockResolvedValueOnce({ sheetId: '123', sheetName: 'Sheet1' });

			const mockSheet1Result = [
				{ json: { result: 'sheet1-item1' } },
				{ json: { result: 'sheet1-item3' } },
			];
			const mockSheet2Result = [{ json: { result: 'sheet2-item2' } }];

			(sheet.append.execute as jest.Mock)
				.mockResolvedValueOnce(mockSheet1Result)
				.mockResolvedValueOnce(mockSheet2Result);

			const result = await router.call(mockExecuteFunctions as IExecuteFunctions);

			expect(sheet.append.execute).toHaveBeenCalledTimes(2);

			expect(sheet.append.execute).toHaveBeenNthCalledWith(1, expect.any(Object), 'Sheet1', '123', [
				{ index: 0, data: mockInputData[0] },
				{ index: 2, data: mockInputData[2] },
			]);

			expect(sheet.append.execute).toHaveBeenNthCalledWith(2, expect.any(Object), 'Sheet2', '456', [
				{ index: 1, data: mockInputData[1] },
			]);

			expect(result).toEqual([[...mockSheet1Result, ...mockSheet2Result]]);
		});

		it('should preserve original item indices in batched items', async () => {
			(resolveSheet as jest.Mock)
				.mockResolvedValueOnce({ sheetId: 'sheet-a', sheetName: 'Sheet A' })
				.mockResolvedValueOnce({ sheetId: 'sheet-b', sheetName: 'Sheet B' })
				.mockResolvedValueOnce({ sheetId: 'sheet-a', sheetName: 'Sheet A' });

			(sheet.append.execute as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

			await router.call(mockExecuteFunctions as IExecuteFunctions);

			const mockCalls = (sheet.append.execute as jest.Mock).mock.calls as unknown[][];
			const sheetACall = mockCalls.find((call) => call[2] === 'sheet-a');
			const sheetBCall = mockCalls.find((call) => call[2] === 'sheet-b');

			expect(sheetACall?.[3]).toEqual([
				{ index: 0, data: mockInputData[0] },
				{ index: 2, data: mockInputData[2] },
			]);

			expect(sheetBCall?.[3]).toEqual([{ index: 1, data: mockInputData[1] }]);
		});
	});

	describe('error handling', () => {
		beforeEach(() => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('sheet') // resource
				.mockReturnValueOnce('append') // operation
				.mockReturnValueOnce({ mode: 'id', value: 'test-spreadsheet-id' }); // documentId

			(getSpreadsheetId as jest.Mock).mockReturnValue('test-spreadsheet-id');
			(GoogleSheet as jest.Mock).mockImplementation(() => ({
				id: 'test-spreadsheet-id',
			}));
		});

		it('should throw error when continueOnFail is false', async () => {
			const error = new Error('Test error');
			(resolveSheet as jest.Mock).mockRejectedValue(error);

			await expect(router.call(mockExecuteFunctions as IExecuteFunctions)).rejects.toThrow(
				'Test error',
			);
		});

		it('should return error in result when continueOnFail is true', async () => {
			const error = new Error('Test error');
			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(true);
			(resolveSheet as jest.Mock).mockRejectedValue(error);

			const result = await router.call(mockExecuteFunctions as IExecuteFunctions);

			expect(result).toEqual([
				[
					{
						json: mockInputData[0].json,
						error,
					},
				],
			]);
		});

		it('should handle errors in sheet operation execution', async () => {
			(resolveSheet as jest.Mock).mockResolvedValue({ sheetId: '123', sheetName: 'Sheet1' });

			const error = new Error('Sheet operation failed');
			(sheet.append.execute as jest.Mock).mockRejectedValue(error);
			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(true);

			const result = await router.call(mockExecuteFunctions as IExecuteFunctions);

			expect(result).toEqual([
				[
					{
						json: mockInputData[0].json,
						error,
					},
				],
			]);
		});
	});

	describe('edge cases', () => {
		it('should handle empty input data', async () => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('sheet') // resource
				.mockReturnValueOnce('append') // operation
				.mockReturnValueOnce({ mode: 'id', value: 'test-spreadsheet-id' }); // documentId

			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue([]);
			(getSpreadsheetId as jest.Mock).mockReturnValue('test-spreadsheet-id');
			(GoogleSheet as jest.Mock).mockImplementation(() => ({
				id: 'test-spreadsheet-id',
			}));

			const result = await router.call(mockExecuteFunctions as IExecuteFunctions);

			expect(resolveSheet).not.toHaveBeenCalled();
			expect(sheet.append.execute).not.toHaveBeenCalled();
			expect(result).toEqual([[]]);
		});

		it('should handle single item input', async () => {
			const singleItem = [{ json: { id: 1, name: 'Single Item' }, pairedItem: { item: 0 } }];

			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('sheet') // resource
				.mockReturnValueOnce('read') // operation
				.mockReturnValueOnce({ mode: 'name', value: 'Sheet1' }); // documentId

			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(singleItem);
			(getSpreadsheetId as jest.Mock).mockReturnValue('single-spreadsheet');
			(GoogleSheet as jest.Mock).mockImplementation(() => ({
				id: 'single-spreadsheet',
			}));

			(resolveSheet as jest.Mock).mockResolvedValue({
				sheetId: 'single',
				sheetName: 'Single Sheet',
			});

			const mockResult = [{ json: { data: 'single result' } }];
			(sheet.read.execute as jest.Mock).mockResolvedValue(mockResult);

			const result = await router.call(mockExecuteFunctions as IExecuteFunctions);

			expect(sheet.read.execute).toHaveBeenCalledTimes(1);
			expect(sheet.read.execute).toHaveBeenCalledWith(
				expect.any(Object),
				'Single Sheet',
				'single',
				[{ index: 0, data: singleItem[0] }],
			);

			expect(result).toEqual([mockResult]);
		});
	});
});
