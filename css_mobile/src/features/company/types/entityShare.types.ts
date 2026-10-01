export type EntityShareType = 'NORMAL' | 'BONUS' | 'GUARANTEE';

export type EntityShare = {
  id: number;
  entity_id: number;
  currency: string;
  share_class_id: number;
  share_type?: EntityShareType;
  number_of_shares?: number;
  authorized_share_capital?: number;
  issued_share_capital?: number;
  paid_up_capital?: number;
  per_share?: number;
  issued_per_share?: number;
  guarantee_amount?: number | null;
  date_of_transaction?: string;
  source_from?: string;
  share_class?: {
    sc_id?: number;
    sc_name?: string;
    sc_slug?: string;
    sc_type?: string;
  };
};

export type EntityShareHistory = EntityShare & {
  entity_shares_id?: number;
  transaction_type?: string;
  delta_shares?: number | null;
  delta_paid_capital?: number | null;
  delta_issued_capital?: number | null;
  delta_authorized_capital?: number | null;
  remarks?: string | null;
  created_at?: string;
};

export type EntityShareFormData = {
  currency: string;
  share_class_id: string;
  share_type: EntityShareType;
  number_of_shares: string;
  authorized_share_capital: string;
  issued_share_capital: string;
  paid_up_capital: string;
  guarantee_amount: string;
  date_of_transaction: string;
  transaction_type: string;
  remarks: string;
};

export type ShareClassOption = {
  sc_id: number;
  sc_name?: string;
  sc_type?: string;
};

export type EntityShareListParams = {
  page?: number;
  limit?: number;
  entity_id: number;
  currency?: string;
  share_class_id?: number;
  share_type?: EntityShareType;
};

export type EntityShareListResult = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: EntityShare[];
};

export type EntitySharePayload = {
  entity_id: number;
  currency: string;
  share_class_id: number;
  share_type?: EntityShareType;
  number_of_shares: number;
  authorized_share_capital: number;
  issued_share_capital: number;
  paid_up_capital: number;
  guarantee_amount?: number | null;
  date_of_transaction?: string;
  transaction_type?: string;
  source_from?: string;
  remarks?: string;
};

export type EntityShareDecimalSettings = {
  entity_id?: number;
  no_of_share_decimal_place?: number | null;
  paid_up_share_decimal_place?: number | null;
  issued_share_decimal_place?: number | null;
};
