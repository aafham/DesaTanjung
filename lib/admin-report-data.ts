import { getAdminDashboardData } from "@/lib/admin-dashboard-data";

export async function getAdminReportData(filterMonth?: string) {
  const adminData = await getAdminDashboardData(filterMonth);
  const { residents, currentMonth, settings } = adminData;

  const paidResidents = residents.filter(
    (resident) => resident.currentPayment?.display_status === "paid",
  );
  const pendingResidents = residents.filter(
    (resident) => resident.currentPayment?.display_status === "pending",
  );
  const overdueResidents = residents.filter(
    (resident) => resident.currentPayment?.display_status === "overdue",
  );
  const rejectedResidents = residents.filter(
    (resident) => resident.currentPayment?.status === "rejected",
  );
  const unpaidResidents = residents.filter(
    (resident) => resident.currentPayment?.display_status === "unpaid",
  );
  const unsettledResidents = residents.filter((resident) => {
    const displayStatus = resident.currentPayment?.display_status ?? "unpaid";
    return !["paid", "pending"].includes(displayStatus);
  });
  const monthlyFee = settings.monthly_fee ?? 0;

  return {
    ...adminData,
    totals: {
      totalResidents: residents.length,
      paidCount: paidResidents.length,
      pendingCount: pendingResidents.length,
      overdueCount: overdueResidents.length,
      rejectedCount: rejectedResidents.length,
      unpaidCount: unpaidResidents.length,
      expectedCollection: monthlyFee * residents.length,
      collectedAmount: monthlyFee * paidResidents.length,
      unsettledCount: unsettledResidents.length,
      outstandingAmount: monthlyFee * unsettledResidents.length,
    },
    currentMonth,
  };
}
