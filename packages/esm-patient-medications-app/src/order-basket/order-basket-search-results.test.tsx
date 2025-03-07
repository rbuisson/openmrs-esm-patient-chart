import React from 'react';
import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getByTextWithMarkup } from '../../../../tools/test-helpers';
import { mockMedicationOrderSearchResults, mockOrderTemplates } from '../../../../__mocks__/medication.mock';
import { paginate } from '../utils/pagination';
import { searchMedications } from './drug-search';
import OrderBasketSearchResults from './order-basket-search-results.component';

const mockPaginate = paginate as jest.Mock;
const mockSearchMedications = searchMedications as jest.Mock;

const testProps = {
  encounterUuid: '',
  onSearchResultClicked: jest.fn(),
  searchTerm: 'aspirin',
  setSearchTerm: jest.fn(),
};

jest.mock('./drug-search', () => ({
  searchMedications: jest.fn(),
  searchDrugsInBackend: jest.fn(),
  explodeDrugResultWithCommonMedicationData: jest.fn(),
  filterExplodedResultsBySearchTerm: jest.fn(),
  includesIgnoreCase: jest.fn(),
}));

jest.mock('../utils/pagination', () => ({
  paginate: jest.fn(),
}));

describe('OrderBasketSearchResults', () => {
  test('renders matching orders as clickable tiles after searching for a drug order', async () => {
    const user = userEvent.setup();
    // link order template
    mockMedicationOrderSearchResults[0]['template'] = mockOrderTemplates[0].template;

    mockSearchMedications.mockResolvedValue(mockMedicationOrderSearchResults);
    mockPaginate.mockReturnValue([mockMedicationOrderSearchResults]);

    renderOrderBasketSearchResults();

    await screen.findAllByRole('listitem');
    expect(screen.getAllByRole('listitem').length).toEqual(3);
    // Anotates results with dosing info if an order-template was found.
    expect(getByTextWithMarkup(/Aspirin — 81 mg — Tablet\s*Once daily — Oral/i)).toBeInTheDocument();
    // Only displays drug name for results without a matching order template
    expect(getByTextWithMarkup(/Aspirin 125mg/i)).toBeInTheDocument();
    expect(getByTextWithMarkup(/Aspirin 243mg/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Immediately add to basket/i }).length).toEqual(3);

    await waitFor(() => user.click(screen.getAllByRole('listitem')[0]));

    expect(testProps.onSearchResultClicked).toHaveBeenCalledWith(mockMedicationOrderSearchResults[0], false);
  });
});

function renderOrderBasketSearchResults() {
  render(<OrderBasketSearchResults {...testProps} />);
}
