import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const expensesEndpointPath = import.meta.env.VITE_EXPENSES_ENDPOINT_PATH || '/expenses';

/**
 * Infrastructure gateway for the Expense bounded-context endpoints.
 * Expenses are served by the real Viora Platform backend: list by active grower
 * and optional plot, then register operational expenses for the active grower.
 *
 * @class ExpenseApi
 * @extends BaseApi
 */
export class ExpenseApi extends BaseApi {
  #expensesEndpoint;

  constructor() {
    super();
    this.#expensesEndpoint = new BaseEndpoint(this, expensesEndpointPath);
  }

  /**
   * Fetches expenses, optionally filtered by plot.
   * @param {number|string|null} plotId
   * @returns {Promise<import('axios').AxiosResponse<Array>>}
   */
  getExpenses(plotId = null) {
    const params = plotId != null ? { plotId } : {};
    return this.#expensesEndpoint.getAll(params);
  }

  /**
   * Creates a new expense record for the active grower.
   * @param {Object} request - Expense payload without growerId.
   * @returns {Promise<import('axios').AxiosResponse<Object>>}
   */
  createExpense(request) {
    return this.#expensesEndpoint.create(request);
  }
}
