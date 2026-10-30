import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import toast from 'react-hot-toast';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CircleDollarSign,
  PackageCheck,
  RefreshCw,
  ShoppingCart,
  Users,
} from 'lucide-react';
import api from '../../services/api';

ChartJS.register(
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
);

const EMPTY_STATS = {
  totalRevenue: 0,
  totalOrders: 0,
  totalProducts: 0,
  totalUsers: 0,
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  'Không thể tải dữ liệu dashboard';

const readTrend = (value) => {
  if (!Array.isArray(value) || value.length === 0) return null;
  return value
    .map((point, index) => ({
      label: point.label || point.date || point.period || `Kỳ ${index + 1}`,
      value: Number(point.value ?? point.total ?? point.amount ?? 0),
    }))
    .filter((point) => Number.isFinite(point.value));
};

const getLocalTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalCurrentMonthString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getLocalCurrentYearString = () => String(new Date().getFullYear());

const DashboardPage = () => {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Time filter states
  const [filterType, setFilterType] = useState('all');
  const [selectedDate, setSelectedDate] = useState(getLocalTodayString);
  const [selectedMonth, setSelectedMonth] = useState(getLocalCurrentMonthString);
  const [selectedYear, setSelectedYear] = useState(getLocalCurrentYearString);

  const availableYears = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 3, current - 2, current - 1, current, current + 1].map(String);
  }, []);

  const fetchStats = useCallback(
    async (overrideFilters) => {
      try {
        setLoading(true);
        const activeType = overrideFilters?.filterType ?? filterType;
        const activeDate = overrideFilters?.selectedDate ?? selectedDate;
        const activeMonth = overrideFilters?.selectedMonth ?? selectedMonth;
        const activeYear = overrideFilters?.selectedYear ?? selectedYear;

        let response;
        if (activeType && activeType !== 'all') {
          const params = { filterType: activeType };
          if (activeType === 'day') {
            params.date = activeDate;
          } else if (activeType === 'month') {
            params.month = activeMonth;
            if (activeMonth.includes('-')) {
              params.year = activeMonth.split('-')[0];
            }
          } else if (activeType === 'year') {
            params.year = activeYear;
          }
          response = await api.get('/api/admin/stats', { params });
        } else {
          response = await api.get('/api/admin/stats');
        }

        const receivedStats = response.data?.stats || {};
        setStats({ ...EMPTY_STATS, ...receivedStats });
        setTrendData(
          readTrend(receivedStats.revenueTrend) ||
            readTrend(receivedStats.orderTrend) ||
            readTrend(receivedStats.trend)
        );
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [filterType, selectedDate, selectedMonth, selectedYear]
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const kpis = useMemo(
    () => [
      {
        label: 'Tổng doanh thu',
        value: formatCurrency(stats.totalRevenue),
        detail: 'Từ các đơn hàng hợp lệ',
        icon: CircleDollarSign,
        className: 'dashboard-kpi-revenue',
      },
      {
        label: 'Tổng đơn hàng',
        value: formatNumber(stats.totalOrders),
        detail: 'Đơn không bị hủy',
        icon: ShoppingCart,
        className: 'dashboard-kpi-orders',
      },
      {
        label: 'Người dùng hoạt động',
        value: formatNumber(stats.totalUsers),
        detail: 'Tài khoản đang hoạt động',
        icon: Users,
        className: 'dashboard-kpi-users',
      },
      {
        label: 'Sản phẩm',
        value: formatNumber(stats.totalProducts),
        detail: 'Sản phẩm đang quản lý',
        icon: PackageCheck,
        className: 'dashboard-kpi-products',
      },
    ],
    [stats]
  );

  const overviewData = useMemo(
    () => ({
      labels: ['Doanh thu', 'Đơn hàng', 'Người dùng hoạt động', 'Sản phẩm'],
      datasets: [
        {
          label: 'Giá trị hiện tại',
          data: [
            Number(stats.totalRevenue || 0),
            Number(stats.totalOrders || 0),
            Number(stats.totalUsers || 0),
            Number(stats.totalProducts || 0),
          ],
          backgroundColor: ['#4338ca', '#1d4ed8', '#7c3aed', '#0f766e'],
          hoverBackgroundColor: ['#3730a3', '#1e40af', '#6d28d9', '#0d9488'],
          borderRadius: 8,
          maxBarThickness: 48,
        },
      ],
    }),
    [stats]
  );

  const lineData = useMemo(() => {
    if (!trendData) return null;
    return {
      labels: trendData.map((point) => point.label),
      datasets: [
        {
          label: 'Doanh thu',
          data: trendData.map((point) => point.value),
          borderColor: '#2563eb',
          backgroundColor: 'rgb(37 99 235 / 12%)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [trendData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        callbacks: {
          label: (context) => {
            if (context.dataIndex === 0) {
              return ` Doanh thu: ${formatCurrency(context.raw)}`;
            }
            return ` ${context.dataset.label || 'Giá trị'}: ${formatNumber(context.raw)}`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } },
      y: {
        beginAtZero: true,
        grid: { color: '#e2e8f0' },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
    },
  };

  return (
    <div className="dashboard-page">
      <style>{`
        .dashboard-page { min-height: 100vh; padding: 36px clamp(16px, 4vw, 56px) 56px; background: #f8fafc; color: #0f172a; }
        .dashboard-shell { max-width: 1440px; margin: 0 auto; }
        .dashboard-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 28px; }
        .dashboard-eyebrow { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
        .dashboard-header h1 { margin: 8px 0 6px; font-size: clamp(26px, 4vw, 36px); letter-spacing: -.04em; }
        .dashboard-header p { color: #64748b; font-size: 14px; }
        .dashboard-refresh { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid #cbd5e1; border-radius: 9px; background: #fff; color: #334155; padding: 10px 14px; font: inherit; font-size: 13px; font-weight: 700; transition: .2s; }
        .dashboard-refresh:hover:not(:disabled) { background: #f1f5f9; }
        .dashboard-refresh:disabled { cursor: not-allowed; opacity: .6; }
        .dashboard-spin { animation: dashboard-spin 1s linear infinite; }
        @keyframes dashboard-spin { to { transform: rotate(360deg); } }
        .dashboard-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
        .dashboard-kpi { border: 1px solid #e2e8f0; border-radius: 15px; background: #fff; padding: 20px; box-shadow: 0 4px 16px rgb(15 23 42 / 4%); transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
        .dashboard-kpi:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgb(15 23 42 / 8%); border-color: #cbd5e1; }
        .dashboard-kpi-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .dashboard-kpi-icon { display: grid; place-items: center; width: 39px; height: 39px; border-radius: 10px; }
        .dashboard-kpi-revenue .dashboard-kpi-icon { background: #e0e7ff; color: #4338ca; }
        .dashboard-kpi-orders .dashboard-kpi-icon { background: #dbeafe; color: #1d4ed8; }
        .dashboard-kpi-users .dashboard-kpi-icon { background: #ede9fe; color: #7c3aed; }
        .dashboard-kpi-products .dashboard-kpi-icon { background: #ccfbf1; color: #0f766e; }
        .dashboard-kpi-label { color: #64748b; font-size: 12px; font-weight: 700; }
        .dashboard-kpi-value { display: block; margin-top: 16px; font-size: clamp(21px, 2.2vw, 28px); letter-spacing: -.04em; line-height: 1.15; }
        .dashboard-kpi-detail { display: flex; align-items: center; gap: 5px; color: #64748b; font-size: 11px; margin-top: 8px; }
        .dashboard-kpi-change { display: inline-flex; align-items: center; gap: 3px; border-radius: 999px; background: #f0fdf4; color: #15803d; padding: 4px 7px; font-size: 10px; font-weight: 800; }
        .dashboard-chart-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(300px, 1fr); gap: 20px; }
        .dashboard-card { min-width: 0; border: 1px solid #e2e8f0; border-radius: 15px; background: #fff; box-shadow: 0 4px 16px rgb(15 23 42 / 4%); }
        .dashboard-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 22px 0; }
        .dashboard-card-header h2 { font-size: 17px; }
        .dashboard-card-header p { color: #64748b; font-size: 12px; margin-top: 4px; }
        .dashboard-card-icon { color: #64748b; }

        /* Filter Controls */
        .dashboard-filter-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 14px 22px; margin-top: 14px; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; background: #fafbfc; }
        .dashboard-filter-tabs { display: inline-flex; align-items: center; gap: 4px; background: #f1f5f9; padding: 3px; border-radius: 9px; border: 1px solid #e2e8f0; }
        .dashboard-filter-btn { border: none; background: transparent; color: #64748b; font: inherit; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 7px; cursor: pointer; transition: all .2s ease; white-space: nowrap; }
        .dashboard-filter-btn:hover:not(.active) { color: #0f172a; }
        .dashboard-filter-btn.active { background: #fff; color: #4338ca; font-weight: 700; box-shadow: 0 1px 3px rgb(15 23 42 / 8%); }
        .dashboard-filter-input-wrap { display: flex; align-items: center; gap: 8px; }
        .dashboard-filter-icon { color: #64748b; }
        .dashboard-filter-input, .dashboard-filter-select { border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; color: #0f172a; font: inherit; font-size: 12px; font-weight: 600; padding: 6px 10px; outline: none; transition: border-color .15s, box-shadow .15s; }
        .dashboard-filter-input:focus, .dashboard-filter-select:focus { border-color: #4338ca; box-shadow: 0 0 0 3px rgb(67 56 202 / 12%); }
        .dashboard-filter-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

        .dashboard-chart { height: 285px; padding: 20px 22px 22px; }
        .dashboard-trend-empty { display: grid; place-items: center; height: 100%; padding: 30px; border: 1px dashed #cbd5e1; border-radius: 10px; color: #64748b; text-align: center; font-size: 12px; }
        .dashboard-trend-empty strong { display: block; color: #334155; font-size: 13px; margin-bottom: 5px; }
        .dashboard-loading { display: grid; place-items: center; min-height: 300px; color: #64748b; font-size: 13px; }
        @media (max-width: 1000px) { .dashboard-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } .dashboard-chart-grid { grid-template-columns: 1fr; } }
        @media (max-width: 600px) {
          .dashboard-page { padding-top: 24px; }
          .dashboard-header { align-items: flex-start; flex-direction: column; }
          .dashboard-kpis { grid-template-columns: 1fr; }
          .dashboard-card-header { padding-inline: 16px; }
          .dashboard-filter-toolbar { flex-direction: column; align-items: stretch; padding-inline: 16px; }
          .dashboard-filter-tabs { display: grid; grid-template-columns: repeat(4, 1fr); text-align: center; }
          .dashboard-filter-btn { padding: 6px 4px; font-size: 11px; text-align: center; }
          .dashboard-filter-input-wrap { width: 100%; }
          .dashboard-filter-input, .dashboard-filter-select { width: 100%; }
          .dashboard-chart { padding-inline: 16px; }
        }
      `}</style>

      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div>
            <div className="dashboard-eyebrow"><BarChart3 size={15} /> Tổng quan kinh doanh</div>
            <h1>Dashboard điều hành</h1>
            <p>Theo dõi sức khỏe hoạt động của cửa hàng từ một nơi.</p>
          </div>
          <button type="button" className="dashboard-refresh" onClick={() => fetchStats()} disabled={loading} data-testid="dashboard-refresh-btn" aria-label="Làm mới dữ liệu" aria-busy={loading}>
            <RefreshCw size={15} className={loading ? 'dashboard-spin' : ''} /> Làm mới dữ liệu
          </button>
        </header>

        {loading ? (
          <div className="dashboard-card dashboard-loading"><RefreshCw size={24} className="dashboard-spin" /> Đang tải dữ liệu dashboard...</div>
        ) : (
          <>
            <section className="dashboard-kpis" aria-label="Chỉ số tổng quan">
              {kpis.map(({ label, value, detail, icon: Icon, className }) => (
                <article className={`dashboard-kpi ${className}`} key={label}>
                  <div className="dashboard-kpi-top"><span className="dashboard-kpi-label">{label}</span><div className="dashboard-kpi-icon"><Icon size={19} /></div></div>
                  <strong className="dashboard-kpi-value">{value}</strong>
                  <span className="dashboard-kpi-detail"><span className="dashboard-kpi-change"><ArrowUpRight size={11} /> Live</span>{detail}</span>
                </article>
              ))}
            </section>

            <section className="dashboard-chart-grid">
              <article className="dashboard-card" data-testid="overview-chart-card">
                <div className="dashboard-card-header">
                  <div>
                    <h2>Hiệu suất tổng quan</h2>
                    <p>Các chỉ số đang được cập nhật từ hệ thống</p>
                  </div>
                  <BarChart3 size={19} className="dashboard-card-icon" />
                </div>

                <div className="dashboard-filter-toolbar" aria-label="Thanh điều khiển bộ lọc thời gian">
                  <div className="dashboard-filter-tabs" role="tablist" aria-label="Chế độ lọc">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={filterType === 'all'}
                      className={`dashboard-filter-btn ${filterType === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterType('all')}
                    >
                      Tất cả
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={filterType === 'day'}
                      className={`dashboard-filter-btn ${filterType === 'day' ? 'active' : ''}`}
                      onClick={() => setFilterType('day')}
                    >
                      Theo ngày
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={filterType === 'month'}
                      className={`dashboard-filter-btn ${filterType === 'month' ? 'active' : ''}`}
                      onClick={() => setFilterType('month')}
                    >
                      Theo tháng
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={filterType === 'year'}
                      className={`dashboard-filter-btn ${filterType === 'year' ? 'active' : ''}`}
                      onClick={() => setFilterType('year')}
                    >
                      Theo năm
                    </button>
                  </div>

                  {filterType === 'day' && (
                    <div className="dashboard-filter-input-wrap">
                      <Calendar size={14} className="dashboard-filter-icon" aria-hidden="true" />
                      <label htmlFor="dashboard-date-filter" className="dashboard-filter-sr-only">Chọn ngày</label>
                      <input
                        id="dashboard-date-filter"
                        type="date"
                        className="dashboard-filter-input"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>
                  )}

                  {filterType === 'month' && (
                    <div className="dashboard-filter-input-wrap">
                      <Calendar size={14} className="dashboard-filter-icon" aria-hidden="true" />
                      <label htmlFor="dashboard-month-filter" className="dashboard-filter-sr-only">Chọn tháng</label>
                      <input
                        id="dashboard-month-filter"
                        type="month"
                        className="dashboard-filter-input"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                      />
                    </div>
                  )}

                  {filterType === 'year' && (
                    <div className="dashboard-filter-input-wrap">
                      <Calendar size={14} className="dashboard-filter-icon" aria-hidden="true" />
                      <label htmlFor="dashboard-year-filter" className="dashboard-filter-sr-only">Chọn năm</label>
                      <select
                        id="dashboard-year-filter"
                        className="dashboard-filter-select"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                      >
                        {availableYears.map((yr) => (
                          <option key={yr} value={yr}>
                            Năm {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="dashboard-chart" data-testid="bar-chart-container"><Bar data={overviewData} options={chartOptions} /></div>
              </article>
              <article className="dashboard-card" data-testid="trend-chart-card">
                <div className="dashboard-card-header"><div><h2>Xu hướng doanh thu</h2><p>Biến động theo dữ liệu backend</p></div><CircleDollarSign size={19} className="dashboard-card-icon" /></div>
                <div className="dashboard-chart" data-testid="line-chart-container">
                  {lineData ? <Line data={lineData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, ticks: { ...chartOptions.scales.y.ticks, callback: (value) => formatCurrency(value) } } } }} /> : <div className="dashboard-trend-empty"><div><ArrowDownRight size={24} /><strong>Chưa có dữ liệu chuỗi thời gian</strong><span>API hiện cung cấp số liệu tổng hợp. Biểu đồ sẽ tự hiển thị khi backend trả về revenueTrend.</span></div></div>}
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
