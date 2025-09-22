import type { IExecuteFunctions, INode } from 'n8n-workflow';

import { resolveSheet } from '../../../v2/actions/utils/resolveSheet';
import type { GoogleSheet } from '../../../v2/helpers/GoogleSheet';
import type { ResourceLocator } from '../../../v2/helpers/GoogleSheets.types';

describe('resolveSheet', () => {
	let mockExecuteFunctions: Partial<IExecuteFunctions>;
	let mockGoogleSheet: Partial<GoogleSheet>;
	let mockNode: INode;

	beforeEach(() => {
		mockNode = {
			id: '1',
			name: 'Google Sheets',
			typeVersion: 4.4,
			type: 'n8n-nodes-base.googleSheets',
			position: [60, 760],
			parameters: {},
		};

		mockExecuteFunctions = {
			getNodeParameter: jest.fn(),
			getNode: jest.fn().mockReturnValue(mockNode),
		};

		mockGoogleSheet = {
			id: 'test-spreadsheet-id',
			spreadsheetGetSheet: jest.fn(),
		};

		jest.clearAllMocks();
	});

	describe('when operation is "create"', () => {
		it('should return spreadsheet id as sheetName and empty sheetId', async () => {
			const result = await resolveSheet.call(
				mockExecuteFunctions as IExecuteFunctions,
				mockGoogleSheet as GoogleSheet,
				'create',
				0,
			);

			expect(result).toEqual({
				sheetId: '',
				sheetName: 'test-spreadsheet-id',
			});

			// Should not call spreadsheetGetSheet for create operation
			expect(mockGoogleSheet.spreadsheetGetSheet).not.toHaveBeenCalled();
			expect(mockExecuteFunctions.getNodeParameter).not.toHaveBeenCalled();
		});
	});

	describe('when operation is not "create"', () => {
		beforeEach(() => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('sheet-within-document') // First call with extractValue: true
				.mockReturnValueOnce({ mode: 'name' as ResourceLocator }); // Second call for mode

			(mockGoogleSheet.spreadsheetGetSheet as jest.Mock).mockResolvedValue({
				sheetId: 123456,
				title: 'Test Sheet',
			});
		});

		it('should call spreadsheetGetSheet with correct parameters', async () => {
			await resolveSheet.call(
				mockExecuteFunctions as IExecuteFunctions,
				mockGoogleSheet as GoogleSheet,
				'append',
				0,
			);

			expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledTimes(2);
			expect(mockExecuteFunctions.getNodeParameter).toHaveBeenNthCalledWith(
				1,
				'sheetName',
				0,
				undefined,
				{ extractValue: true },
			);
			expect(mockExecuteFunctions.getNodeParameter).toHaveBeenNthCalledWith(2, 'sheetName', 0);

			expect(mockGoogleSheet.spreadsheetGetSheet).toHaveBeenCalledWith(
				mockNode,
				'name',
				'sheet-within-document',
			);
		});

		describe('when operation is "delete"', () => {
			it('should return sheetId as sheetName', async () => {
				const result = await resolveSheet.call(
					mockExecuteFunctions as IExecuteFunctions,
					mockGoogleSheet as GoogleSheet,
					'delete',
					0,
				);

				expect(result).toEqual({
					sheetId: '123456',
					sheetName: '123456',
				});
			});
		});

		describe('when operation is "remove"', () => {
			it('should return formatted string with spreadsheet id and sheetId', async () => {
				const result = await resolveSheet.call(
					mockExecuteFunctions as IExecuteFunctions,
					mockGoogleSheet as GoogleSheet,
					'remove',
					0,
				);

				expect(result).toEqual({
					sheetId: '123456',
					sheetName: 'test-spreadsheet-id||123456',
				});
			});
		});

		describe('when operation is any other operation', () => {
			it('should return sheet title as sheetName', async () => {
				const result = await resolveSheet.call(
					mockExecuteFunctions as IExecuteFunctions,
					mockGoogleSheet as GoogleSheet,
					'append',
					0,
				);

				expect(result).toEqual({
					sheetId: '123456',
					sheetName: 'Test Sheet',
				});
			});
		});
	});

	describe('different resource locator modes', () => {
		it('should handle "id" mode', async () => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('123456')
				.mockReturnValueOnce({ mode: 'id' as ResourceLocator });

			(mockGoogleSheet.spreadsheetGetSheet as jest.Mock).mockResolvedValue({
				sheetId: 123456,
				title: 'Sheet by ID',
			});

			const result = await resolveSheet.call(
				mockExecuteFunctions as IExecuteFunctions,
				mockGoogleSheet as GoogleSheet,
				'read',
				0,
			);

			expect(mockGoogleSheet.spreadsheetGetSheet).toHaveBeenCalledWith(mockNode, 'id', '123456');
			expect(result).toEqual({
				sheetId: '123456',
				sheetName: 'Sheet by ID',
			});
		});

		it('should handle "url" mode', async () => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('https://docs.google.com/spreadsheets/d/abc/edit#gid=123456')
				.mockReturnValueOnce({ mode: 'url' as ResourceLocator });

			(mockGoogleSheet.spreadsheetGetSheet as jest.Mock).mockResolvedValue({
				sheetId: 123456,
				title: 'Sheet by URL',
			});

			const result = await resolveSheet.call(
				mockExecuteFunctions as IExecuteFunctions,
				mockGoogleSheet as GoogleSheet,
				'update',
				0,
			);

			expect(mockGoogleSheet.spreadsheetGetSheet).toHaveBeenCalledWith(
				mockNode,
				'url',
				'https://docs.google.com/spreadsheets/d/abc/edit#gid=123456',
			);
			expect(result).toEqual({
				sheetId: '123456',
				sheetName: 'Sheet by URL',
			});
		});

		it('should handle "list" mode', async () => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('Sheet from List')
				.mockReturnValueOnce({ mode: 'list' as ResourceLocator });

			(mockGoogleSheet.spreadsheetGetSheet as jest.Mock).mockResolvedValue({
				sheetId: 789012,
				title: 'Sheet from List',
			});

			const result = await resolveSheet.call(
				mockExecuteFunctions as IExecuteFunctions,
				mockGoogleSheet as GoogleSheet,
				'clear',
				0,
			);

			expect(mockGoogleSheet.spreadsheetGetSheet).toHaveBeenCalledWith(
				mockNode,
				'list',
				'Sheet from List',
			);
			expect(result).toEqual({
				sheetId: '789012',
				sheetName: 'Sheet from List',
			});
		});
	});

	describe('different item indices', () => {
		it('should use correct item index when passed', async () => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('sheet-for-item-2')
				.mockReturnValueOnce({ mode: 'name' as ResourceLocator });

			(mockGoogleSheet.spreadsheetGetSheet as jest.Mock).mockResolvedValue({
				sheetId: 999,
				title: 'Sheet for Item 2',
			});

			const result = await resolveSheet.call(
				mockExecuteFunctions as IExecuteFunctions,
				mockGoogleSheet as GoogleSheet,
				'append',
				2,
			);

			expect(mockExecuteFunctions.getNodeParameter).toHaveBeenNthCalledWith(
				1,
				'sheetName',
				2,
				undefined,
				{ extractValue: true },
			);
			expect(mockExecuteFunctions.getNodeParameter).toHaveBeenNthCalledWith(2, 'sheetName', 2);

			expect(result).toEqual({
				sheetId: '999',
				sheetName: 'Sheet for Item 2',
			});
		});
	});

	describe('sheetId number conversion', () => {
		it('should convert numeric sheetId to string', async () => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('sheet-name')
				.mockReturnValueOnce({ mode: 'name' as ResourceLocator });

			(mockGoogleSheet.spreadsheetGetSheet as jest.Mock).mockResolvedValue({
				sheetId: 0,
				title: 'Default Sheet',
			});

			const result = await resolveSheet.call(
				mockExecuteFunctions as IExecuteFunctions,
				mockGoogleSheet as GoogleSheet,
				'read',
				0,
			);

			expect(result).toEqual({
				sheetId: '0',
				sheetName: 'Default Sheet',
			});
		});
	});
});
