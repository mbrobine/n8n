import { type IExecuteFunctions, type IDataObject, type INodeExecutionData } from 'n8n-workflow';

import * as sheet from './sheet/Sheet.resource';
import * as spreadsheet from './spreadsheet/SpreadSheet.resource';
import { GoogleSheet } from '../helpers/GoogleSheet';
import type { GoogleSheets, ResourceLocator } from '../helpers/GoogleSheets.types';
import { getSpreadsheetId } from '../helpers/GoogleSheets.utils';
import type { IndexedItem } from '../types';
import { resolveSheet } from './utils/resolveSheet';

export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	let operationResult: INodeExecutionData[] = [];

	try {
		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		const googleSheets = {
			resource,
			operation,
		} as GoogleSheets;

		let results: INodeExecutionData[] | undefined;
		if (googleSheets.resource === 'sheet') {
			const { mode, value } = this.getNodeParameter('documentId', 0) as IDataObject;
			const spreadsheetId = getSpreadsheetId(
				this.getNode(),
				mode as ResourceLocator,
				value as string,
			);

			const googleSheet = new GoogleSheet(spreadsheetId, this);

			const sheets: { [sheetId: string]: { items: IndexedItem[]; sheetName: string } } = {};

			const items = this.getInputData();
			for (let i = 0; i < items.length; i++) {
				const { sheetId, sheetName } = await resolveSheet.call(this, googleSheet, operation, i);
				if (!sheets[sheetId]) {
					sheets[sheetId] = { items: [{ index: i, data: items[i] }], sheetName };
				} else {
					sheets[sheetId].items.push({ index: i, data: items[i] });
				}
			}
			results = [];
			// TODO: batch all actions into one batchUpdate request
			for (const [sheetId, { items, sheetName }] of Object.entries(sheets)) {
				const data = await sheet[googleSheets.operation].execute.call(
					this,
					googleSheet,
					sheetName,
					sheetId,
					items,
				);
				results.push.apply(results, data);
			}
		} else if (googleSheets.resource === 'spreadsheet') {
			results = await spreadsheet[googleSheets.operation].execute.call(this);
		}
		if (results?.length) {
			operationResult = operationResult.concat(results);
		}
	} catch (error) {
		if (this.continueOnFail()) {
			operationResult.push({ json: this.getInputData(0)[0].json, error });
		} else {
			throw error;
		}
	}

	return [operationResult];
}
