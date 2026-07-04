import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const expensesEndpointPath = import.meta.env.VITE_EXPENSES_ENDPOINT_PATH || '/api/v1/expenses';

/**
 * Infrastructure gateway for the Expense bounded-context endpoints.
 * Targets the mock API (json-server) via Vite proxy while the real backend
 * is under construction. Extends BaseApi for consistent auth interceptor
 * and HTTP client management.
 *
 * @class ExpenseApi
 * @extends BaseApi
 */
export class ExpenseApi extends BaseApi {
  #expensesEndpoint;

  constructor() {
    super();
    this.#expensesEndpoint = new BaseEndpoint(this, expensesEndpointPath, { mock: true });
  }

  /**
   * Fetches expenses, optionally filtered by plot.
   * @param {number|string|null} plotId
   * @returns {Promise<import('axios').AxiosResponse<Array>>}
   */
  getExpenses(plotId = null) {
    const params = plotId != null ? { plotId: String(plotId) } : {};
    return this.#expensesEndpoint.getAll(params);
  }

  /**
   * Creates a new expense record.
   * @param {Object} request - Expense payload.
   * @returns {Promise<import('axios').AxiosResponse<Object>>}
   */
  createExpense(request) {
    return this.#expensesEndpoint.create(request);
  }
}
