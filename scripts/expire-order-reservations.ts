import { closeDb } from "../lib/admin/db";
import { expirePendingOrders } from "../lib/orders/service";

async function main() {
  const count = await expirePendingOrders();
  console.log("Released " + count + " expired order reservation" + (count === 1 ? "." : "s."));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closeDb);
