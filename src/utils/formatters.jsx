export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined) return '-';
  return Number(num).toFixed(decimals);
};

export const formatPercentage = (num) => {
  if (num === null || num === undefined) return '-';
  return `${formatNumber(num, 0)}%`;
};