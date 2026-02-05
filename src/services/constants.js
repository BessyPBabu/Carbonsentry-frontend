export const ROLES = {
  ADMIN: 'admin',
  OFFICER: 'officer',
  VIEWER: 'viewer'
};

export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
};

export const COMPLIANCE_STATUS = {
  COMPLIANT: 'compliant',
  NON_COMPLIANT: 'non_compliant',
  PENDING: 'pending',
  EXPIRED: 'expired'
};

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const DOCUMENT_STATUS = {
  PENDING: 'pending',
  UPLOADED: 'uploaded',
  VALIDATING: 'validating',
  VALID: 'valid',
  INVALID: 'invalid',
  EXPIRED: 'expired',
  FLAGGED: 'flagged',
  NEEDS_REPLACEMENT: 'needs_replacement'
};

export const VENDOR_TYPES = {
  SUPPLIER: 'supplier',
  CONTRACTOR: 'contractor',
  PARTNER: 'partner',
  DISTRIBUTOR: 'distributor'
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusColor = (status) => {
  const colors = {
    // User status
    active: 'text-green-600',
    inactive: 'text-gray-600',
    suspended: 'text-red-600',
    
    // Compliance status
    compliant: 'text-green-600',
    non_compliant: 'text-red-600',
    pending: 'text-yellow-600',
    expired: 'text-orange-600',
    
    // Risk levels
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600',
    
    // Document status
    uploaded: 'text-blue-600',
    validating: 'text-purple-600',
    valid: 'text-green-600',
    invalid: 'text-red-600',
    flagged: 'text-orange-600',
    needs_replacement: 'text-red-600'
  };
  return colors[status?.toLowerCase()] || 'text-gray-600';
};

export const getRoleBadgeClass = (role) => {
  const classes = {
    admin: 'bg-purple-100 text-purple-800',
    officer: 'bg-blue-100 text-blue-800',
    viewer: 'bg-gray-100 text-gray-800'
  };
  return classes[role?.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

export const getComplianceBadgeClass = (status) => {
  const classes = {
    compliant: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    non_compliant: 'bg-red-100 text-red-800',
    expired: 'bg-orange-100 text-orange-800'
  };
  return classes[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

export const getRiskBadgeClass = (risk) => {
  const classes = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };
  return classes[risk?.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

export const getDocumentBadgeClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800',
    uploaded: 'bg-blue-100 text-blue-800',
    validating: 'bg-purple-100 text-purple-800',
    valid: 'bg-green-100 text-green-800',
    invalid: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800',
    flagged: 'bg-orange-100 text-orange-800',
    needs_replacement: 'bg-red-100 text-red-800'
  };
  return classes[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

