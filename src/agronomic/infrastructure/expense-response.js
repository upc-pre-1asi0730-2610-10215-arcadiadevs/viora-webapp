import { Expense } from '../domain/model/expense.entity.js';

const TYPES = ['CLIMATE_MITIGATION', 'PEST_INTERVENTION'];
const CATEGORIES = ['INPUTS', 'LABOR', 'EQUIPMENT', 'SPECIALIST'];
const PAYMENT_STATUSES = ['PAID', 'PENDING'];
const STATUSES = ['REGISTERED', 'ALERT_CONFIRMED'];

function normalize(value, known, fallback) {
  const upper = (value ?? '').toUpperCase();
  return known.includes(upper) ? upper : fallback;
}

export class ExpenseAssembler {
  static toEntityFromResource(resource) {
    return new Expense({
      id: resource.id ?? null,
      growerId: resource.growerId ?? null,
      plotId: resource.plotId ?? null,
      type: normalize(resource.type, TYPES, 'CLIMATE_MITIGATION'),
      category: normalize(resource.category, CATEGORIES, 'INPUTS'),
      linkedActionCode: resource.linkedActionCode ?? '',
      amount: resource.amount ?? 0,
      currency: resource.currency ?? 'PEN',
      expenseDate: resource.expenseDate ?? null,
      paymentStatus: normalize(resource.paymentStatus, PAYMENT_STATUSES, 'PAID'),
      note: resource.note ?? '',
      status: normalize(resource.status, STATUSES, 'REGISTERED'),
      createdAt: resource.createdAt ?? null,
      updatedAt: resource.updatedAt ?? null
    });
  }

  static toEntitiesFromResponse(response) {
    const resources = Array.isArray(response?.data) ? response.data : [];
    return resources.map(r => this.toEntityFromResource(r));
  }
}
