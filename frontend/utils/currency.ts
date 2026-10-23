/**
 * Currency utility to format compensation and rates in Indian Rupees (INR - ₹).
 */

export function formatINR(compensation?: string | null): string {
  if (!compensation) return "₹4,000 - ₹6,000 / hr";

  // If already formatted in INR (contains ₹), return as is
  if (compensation.includes("₹")) {
    return compensation;
  }

  // If contains dollar sign, convert each $ amount to approximate INR (1 USD = ~80 INR)
  if (compensation.includes("$")) {
    return compensation.replace(/\$\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, (_, val) => {
      const cleanNum = parseFloat(val.replace(/,/g, ""));
      if (isNaN(cleanNum)) return "₹0";

      // If amount is an hourly rate (< 1000, e.g. $75 -> ₹6,000)
      if (cleanNum < 1000) {
        const inrVal = Math.round(cleanNum * 80);
        return `₹${inrVal.toLocaleString("en-IN")}`;
      }

      // If amount is a monthly or total contract sum (e.g. $5,000 -> ₹4,00,000)
      const inrVal = Math.round(cleanNum * 80);
      return `₹${inrVal.toLocaleString("en-IN")}`;
    });
  }

  // If numeric or plain text, prepend ₹
  return `₹${compensation}`;
}
