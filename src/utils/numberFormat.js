export const formatNumber = (value, options = {}) => {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    emptyValue = "0.00",
  } = options;

  if (value === null || value === undefined || value === "") return emptyValue;
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return emptyValue;

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num);
};

export const formatNumberOrDash = (value, options = {}) => {
  const num = typeof value === "number" ? value : Number(value);
  if (!num || Number.isNaN(num)) return "-";
  return formatNumber(num, options);
};


