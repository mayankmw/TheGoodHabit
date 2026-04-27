import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { toast } from "sonner";
import { useAdminStore } from "@/store/useAdminStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DashboardRange = "last7" | "last30" | "lastYear" | "custom";
type TrendPoint = { date: string; value: number };
type TrendGranularity = "day" | "week" | "month";

const formatRangeLabel = (
  range: DashboardRange,
  startDate?: string,
  endDate?: string
) => {
  if (range === "last7") return "Last 7 Days";
  if (range === "last30") return "Last 30 Days";
  if (range === "lastYear") return "Last Year";
  if (startDate && endDate) {
    return `${startDate} - ${endDate}`;
  }
  return "Custom Range";
};

const parseTrendDate = (value: string | Date) => {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const normalized = String(value).split("T")[0];
  const [year, month, day] = normalized.split("-").map(Number);

  if (year && month && day) {
    return new Date(year, month - 1, day);
  }

  const fallback = new Date(value);
  return new Date(
    fallback.getFullYear(),
    fallback.getMonth(),
    fallback.getDate()
  );
};

const formatDayLabel = (date: Date) =>
  date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });

const getInclusiveDayGap = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return 0;

  const start = parseTrendDate(startDate);
  const end = parseTrendDate(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
};

const resolveTrendGranularity = (
  range: DashboardRange,
  startDate?: string,
  endDate?: string
): TrendGranularity => {
  if (range === "last7") return "day";
  if (range === "last30") return "week";
  if (range === "lastYear") return "month";

  const dayGap = getInclusiveDayGap(startDate, endDate);

  if (dayGap <= 14) return "day";
  if (dayGap <= 90) return "week";
  return "month";
};

const aggregateTrend = (
  points: TrendPoint[],
  granularity: TrendGranularity
) => {
  if (granularity === "day") {
    return points.map((point) => ({
      label: formatDayLabel(parseTrendDate(point.date)),
      value: point.value,
    }));
  }

  if (granularity === "month") {
    const monthMap = new Map<string, { label: string; value: number }>();

    points.forEach((point) => {
      const date = parseTrendDate(point.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const existing = monthMap.get(key);

      if (existing) {
        existing.value += point.value;
        return;
      }

      monthMap.set(key, {
        label: date.toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        }),
        value: point.value,
      });
    });

    return Array.from(monthMap.values());
  }

  const weekBuckets: Array<{
    label: string;
    value: number;
  }> = [];

  for (let index = 0; index < points.length; index += 7) {
    const bucket = points.slice(index, index + 7);
    const start = parseTrendDate(bucket[0].date);
    const end = parseTrendDate(bucket[bucket.length - 1].date);

    weekBuckets.push({
      label:
        start.getMonth() === end.getMonth() &&
        start.getFullYear() === end.getFullYear()
          ? `${String(start.getDate()).padStart(2, "0")}-${String(
              end.getDate()
            ).padStart(2, "0")} ${end.toLocaleDateString("en-IN", {
              month: "short",
            })}`
          : `${formatDayLabel(start)}-${formatDayLabel(end)}`,
      value: bucket.reduce((sum, point) => sum + point.value, 0),
    });
  }

  return weekBuckets;
};

export default function AdminDashboard() {
  const {
    fetchStats,
    fetchRevenueTrend,
    fetchOrdersTrend,
    loadingStats,
    loadingRevenue,
    loadingOrdersTrend,
    stats,
    revenueLast7Days,
    ordersLast7Days,
  } = useAdminStore();

  const [filters, setFilters] = useState<{
    range: DashboardRange;
    startDate: string;
    endDate: string;
  }>({
    range: "last7",
    startDate: "",
    endDate: "",
  });

  const [appliedFilters, setAppliedFilters] = useState<{
    range: DashboardRange;
    startDate?: string;
    endDate?: string;
  }>({
    range: "last7",
  });

  useEffect(() => {
    fetchStats(appliedFilters);
    fetchRevenueTrend(appliedFilters);
    fetchOrdersTrend(appliedFilters);
  }, [appliedFilters, fetchOrdersTrend, fetchRevenueTrend, fetchStats]);

  const handleRangeChange = (value: DashboardRange) => {
    setFilters((prev) => ({ ...prev, range: value }));

    if (value !== "custom") {
      setAppliedFilters({ range: value });
    }
  };

  const applyCustomRange = () => {
    if (!filters.startDate || !filters.endDate) {
      toast.error("Please select both start and end date");
      return;
    }

    if (filters.startDate > filters.endDate) {
      toast.error("Start date cannot be after end date");
      return;
    }

    setAppliedFilters({
      range: "custom",
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
  };

  const rangeLabel = useMemo(
    () =>
      formatRangeLabel(
        appliedFilters.range,
        appliedFilters.startDate,
        appliedFilters.endDate
      ),
    [appliedFilters]
  );

  const trendGranularity = useMemo(
    () =>
      resolveTrendGranularity(
        appliedFilters.range,
        appliedFilters.startDate,
        appliedFilters.endDate
      ),
    [appliedFilters]
  );

  const revenueChartData = useMemo(
    () =>
      aggregateTrend(
        revenueLast7Days.map((r) => ({
          date: r.date,
          value: r.amount,
        })),
        trendGranularity
      ),
    [revenueLast7Days, trendGranularity]
  );

  const ordersChartData = useMemo(
    () =>
      aggregateTrend(
        ordersLast7Days.map((r) => ({
          date: r.date,
          value: r.orders,
        })),
        trendGranularity
      ),
    [ordersLast7Days, trendGranularity]
  );

  if (loadingStats) return <p className="text-center mt-10">Loading...</p>;
  if (!stats) return <p>No data</p>;

  const revenueChart = {
    options: {
      chart: { toolbar: { show: false } },
      stroke: { curve: "smooth", width: 3 },
      colors: ["#facc15"],
      xaxis: {
        categories: revenueChartData.map((r) => r.label),
      },
      dataLabels: { enabled: false },
      fill: { type: "gradient", gradient: { opacityFrom: 0.5, opacityTo: 0 } },
    },
    series: [{ name: "Revenue", data: revenueChartData.map((r) => r.value) }],
  };

  const ordersChart = {
    options: {
      chart: { toolbar: { show: false } },
      colors: ["#34d399"],
      xaxis: {
        categories: ordersChartData.map((r) => r.label),
      },
      dataLabels: { enabled: false },
    },
    series: [{ name: "Orders", data: ordersChartData.map((r) => r.value) }],
  };

  return (
    <div className="p-8 space-y-10 bg-gradient-to-b from-amber-50 to-white min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border shadow-sm">
          <Select value={filters.range} onValueChange={(v) => handleRangeChange(v as DashboardRange)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-50">
              <SelectItem value="last7">Last 7 Days</SelectItem>
              <SelectItem value="last30">Last 30 Days</SelectItem>
              <SelectItem value="lastYear">Last Year</SelectItem>
              <SelectItem value="custom">Custom Date</SelectItem>
            </SelectContent>
          </Select>

          {filters.range === "custom" && (
            <>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-40"
              />
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-40"
              />
              <Button onClick={applyCustomRange}>Apply</Button>
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">Showing data for: {rangeLabel}</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-xl p-6 border">
          <p className="text-gray-500">Total Orders</p>
          <h2 className="text-3xl font-bold">{stats.orders.total}</h2>
          <p className="text-sm text-gray-400">{rangeLabel}</p>
        </div>

        <div className="bg-white shadow rounded-xl p-6 border">
          <p className="text-gray-500">Revenue</p>
          <h2 className="text-3xl font-bold">₹{stats.revenue.totalRevenue}</h2>
          <p className="text-sm text-gray-400">
            Avg Order: ₹{stats.revenue.averageOrderValue}
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-6 border">
          <p className="text-gray-500">Users</p>
          <h2 className="text-3xl font-bold">{stats.users.totalUsers}</h2>
          <p className="text-sm text-gray-400">Added in selected range</p>
        </div>

        <div className="bg-white shadow rounded-xl p-6 border">
          <p className="text-gray-500">Products</p>
          <h2 className="text-3xl font-bold">{stats.products.totalProducts}</h2>
          <p className="text-sm text-gray-400">Added in selected range</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white shadow rounded-xl p-6 border">
          <h2 className="text-lg font-semibold mb-4">Revenue ({rangeLabel})</h2>

          {loadingRevenue ? (
            <p className="text-center py-20 text-gray-400">Loading...</p>
          ) : (
            <Chart type="area" height={320} {...revenueChart} />
          )}
        </div>

        <div className="bg-white shadow rounded-xl p-6 border">
          <h2 className="text-lg font-semibold mb-4">Orders ({rangeLabel})</h2>

          {loadingOrdersTrend ? (
            <p className="text-center py-20 text-gray-400">Loading...</p>
          ) : (
            <Chart type="bar" height={320} {...ordersChart} />
          )}
        </div>
      </div>
    </div>
  );
}
