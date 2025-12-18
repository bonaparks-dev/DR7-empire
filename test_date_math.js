
const pickupDate = "2025-12-15";
const pickupTime = "10:30";
const returnDate = "2025-12-16";
const returnTime = "09:00";

const pickup = new Date(`${pickupDate}T${pickupTime}`);
const returnD = new Date(`${returnDate}T${returnTime}`);
const diffMs = returnD.getTime() - pickup.getTime();
const diffHours = diffMs / (1000 * 60 * 60);

const dayLength = 22.5; // 22h30
const rentalDays = diffHours / dayLength;

console.log(`Diff MS: ${diffMs}`);
console.log(`Diff Hours: ${diffHours}`);
console.log(`Rental Days: ${rentalDays}`);
console.log(`Is < 1? ${rentalDays < 1}`);
console.log(`Precision check: ${diffHours === 22.5}`);
