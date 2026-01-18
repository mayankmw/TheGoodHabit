import { useEffect } from "react";
import { useAdminStore } from "@/store/useAdminStore";
import Chart from "react-apexcharts";

export default function AdminDashboard() {
  const {
    fetchStats,
    fetchRevenueTrend,
    fetchOrdersTrend,

    loadingStats,
    loadingRevenue,
    loadingOrders,

    stats,
    revenueLast7Days,
    ordersLast7Days
  } = useAdminStore();

  useEffect(() => {
    fetchStats();
    fetchRevenueTrend();
    fetchOrdersTrend();
  }, []);

  if (loadingStats) return <p className="text-center mt-10">Loading...</p>;
  if (!stats) return <p>No data</p>;

    const revenueChart = {
    options: {
      chart: { toolbar: { show: false } },
      stroke: { curve: "smooth", width: 3 },
      colors: ["#facc15"],
      xaxis: {
        categories: revenueLast7Days.map(r =>
          new Date(r.date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          })
        ),
      },
      dataLabels: { enabled: false },
      fill: { type: "gradient", gradient: { opacityFrom: 0.5, opacityTo: 0 } }
    },
    series: [{ name: "Revenue", data: revenueLast7Days.map(r => r.amount) }],
  };
  const ordersChart = {
    options: {
      chart: { toolbar: { show: false } },
      colors: ["#34d399"],
      xaxis: {
        categories: ordersLast7Days.map(r =>
          new Date(r.date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          })
        ),
      },
      dataLabels: { enabled: false },
    },
    series: [{ name: "Orders", data: ordersLast7Days.map(r => r.orders) }],
  };


    return (
    <div className="p-8 space-y-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-xl p-6">
          <p className="text-gray-500">Total Orders</p>
          <h2 className="text-3xl font-bold">{stats.orders.total}</h2>
          <p className="text-sm text-gray-400">
            Today: {stats.orders.todayOrders}
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <p className="text-gray-500">Revenue</p>
          <h2 className="text-3xl font-bold">₹{stats.revenue.totalRevenue}</h2>
          <p className="text-sm text-gray-400">
            Today: ₹{stats.revenue.todayRevenue}
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <p className="text-gray-500">Users</p>
          <h2 className="text-3xl font-bold">{stats.users.totalUsers}</h2>
          <p className="text-sm text-gray-400">
            New Today: {stats.users.newToday}
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <p className="text-gray-500">Products</p>
          <h2 className="text-3xl font-bold">{stats.products.totalProducts}</h2>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Revenue */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            Revenue (Last 7 Days)
          </h2>

          {loadingRevenue ? (
            <p className="text-center py-20 text-gray-400">Loading...</p>
          ) : (
            <Chart type="area" height={320} {...revenueChart} />
          )}
        </div>

        {/* Orders */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            Orders (Last 7 Days)
          </h2>

          {loadingOrders ? (
            <p className="text-center py-20 text-gray-400">Loading...</p>
          ) : (
            <Chart type="bar" height={320} {...ordersChart} />
          )}
        </div>

      </div>
    </div>
  );
}
