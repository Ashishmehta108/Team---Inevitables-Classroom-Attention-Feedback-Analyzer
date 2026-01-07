// Bonus calculation logic shared by reports APIs
function calculateBonus(averageRating) {
  if (averageRating >= 4.8) return 600;
  if (averageRating >= 4.5) return 500;
  if (averageRating >= 4.2) return 400;
  if (averageRating >= 4.0) return 300;
  return null; // manual review
}

module.exports = { calculateBonus };

