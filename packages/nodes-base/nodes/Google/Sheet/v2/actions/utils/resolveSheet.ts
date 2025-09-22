import type { IExecuteFunctions } from 'n8n-workflow';

import type { GoogleSheet } from '../../helpers/GoogleSheet';
import type { ResourceLocator } from '../../helpers/GoogleSheets.types';

export async function resolveSheet(
	this: IExecuteFunctions,
	googleSheet: GoogleSheet,
	operation: string,
	itemIndex: number,
) {
	let sheetId = '';
	let sheetName = '';

	if (operation !== 'create') {
		const sheetWithinDocument = this.getNodeParameter('sheetName', itemIndex, undefined, {
			extractValue: true,
		}) as string;
		const { mode: sheetMode } = this.getNodeParameter('sheetName', itemIndex) as {
			mode: ResourceLocator;
		};

		const result = await googleSheet.spreadsheetGetSheet(
			this.getNode(),
			sheetMode,
			sheetWithinDocument,
		);
		sheetId = result.sheetId.toString();
		sheetName = result.title;
	}

	switch (operation) {
		case 'create':
			sheetName = googleSheet.id;
			break;
		case 'delete':
			sheetName = sheetId;
			break;
		case 'remove':
			sheetName = `${googleSheet.id}||${sheetId}`;
			break;
	}

	return { sheetId, sheetName };
}
