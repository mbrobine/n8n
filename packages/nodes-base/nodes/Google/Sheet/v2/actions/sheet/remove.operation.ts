import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';

import { wrapData } from '../../../../../../utils/utilities';
import type { GoogleSheet } from '../../helpers/GoogleSheet';
import { apiRequest } from '../../transport';
import type { IndexedItem } from '../../types';

export async function execute(
	this: IExecuteFunctions,
	_sheet: GoogleSheet,
	sheetName: string,
	_sheetId: string,
	items: IndexedItem[],
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	for (const item of items) {
		const [spreadsheetId, sheetWithinDocument] = sheetName.split('||');
		const requests = [
			{
				deleteSheet: {
					sheetId: sheetWithinDocument,
				},
			},
		];

		const responseData = await apiRequest.call(
			this,
			'POST',
			`/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
			{ requests },
		);
		delete responseData.replies;

		const executionData = this.helpers.constructExecutionMetaData(
			wrapData(responseData as IDataObject[]),
			{ itemData: { item: item.index } },
		);

		returnData.push(...executionData);
	}

	return returnData;
}
