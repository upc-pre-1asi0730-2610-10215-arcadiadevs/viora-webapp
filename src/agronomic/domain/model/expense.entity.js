const TYPE_TAG = {
  CLIMATE_MITIGATION: 'Climate',
  PEST_INTERVENTION: 'Pest'
};

const TYPE_LABEL = {
  CLIMATE_MITIGATION: 'Climate mitigation',
  PEST_INTERVENTION: 'Pest intervention'
};

const CATEGORY_LABEL = {
  INPUTS: 'Inputs',
  LABOR: 'Labor',
  EQUIPMENT: 'Equipment',
  SPECIALIST: 'Specialist'
};

const PAYMENT_LABEL = {
  PAID: 'Paid',
  PENDING: 'Pending'
};

const STATUS_LABEL = {
  REGISTERED: 'Registered',
  ALERT_CONFIRMED: 'Alert confirmed'
};

const CURRENCY_SYMBOLS = {
  PEN: 'S/',
  USD: '$',
  EUR: '\u20AC'
};

export class Expense {
  constructor({
    id = null,
    growerId = null,
    plotId = null,
    type = 'CLIMATE_MITIGATION',
    category = 'INPUTS',
    linkedActionCode = '',
    amount = 0,
    currency = 'PEN',
    expenseDate = null,
    paymentStatus = 'PAID',
    note = '',
    status = 'REGISTERED',
    createdAt = null,
    updatedAt = null
  } = {}) {
    this.id = id;
    this.growerId = growerId;
    this.plotId = plotId;
    this.type = type;
    this.category = category;
    this.linkedActionCode = linkedActionCode;
    this.amount = amount;
    this.currency = currency;
    this.expenseDate = expenseDate;
    this.paymentStatus = paymentStatus;
    this.note = note;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  get typeTag() { return TYPE_TAG[this.type] ?? this.type; }
  get typeLabel() { return TYPE_LABEL[this.type] ?? this.type; }
  get categoryLabel() { return CATEGORY_LABEL[this.category] ?? this.category; }
  get paymentStatusLabel() { return PAYMENT_LABEL[this.paymentStatus] ?? this.paymentStatus; }
  get statusLabel() { return STATUS_LABEL[this.status] ?? this.status; }
  get typeClass() { return this.type === 'PEST_INTERVENTION' ? 'type-pest' : 'type-climate'; }
  get statusClass() { return this.status === 'ALERT_CONFIRMED' ? 'status-alert' : 'status-registered'; }
  get amountLabel() { return Expense.formatMoney(this.amount, this.currency); }
  get dateLabel() { return Expense.formatDate(this.expenseDate); }

  static formatMoney(amount, currency = 'PEN') {
    const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
    return `${symbol} ${(amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  static formatDate(raw) {
    if (!raw) return '\u2014';
    const timestamp = Date.parse(raw);
    if (Number.isNaN(timestamp)) return '\u2014';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(timestamp));
  }
}
