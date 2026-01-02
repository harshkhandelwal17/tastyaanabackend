import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, subDays, parseISO } from "date-fns";
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  useGetTodaysHisaabQuery,
  useGetHisaabHistoryQuery,
} from "../../redux/storee/api";

const ThaliOverview = () => {
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
  });
  const [activeTab, setActiveTab] = useState("today");
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch today's hisaab data
  const {
    data: todaysHisaab,
    isLoading: isLoadingToday,
    refetch: refetchToday,
  } = useGetTodaysHisaabQuery();
  console.log(todaysHisaab);
  // Format date to YYYY-MM-DD in local timezone
  const formatDateForApi = (date) => {
    // Create a new date object to avoid timezone issues
    const d = new Date(date);
    // Get date components in local timezone
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Get date range in UTC to avoid timezone issues
  const getUTCDateString = (date) => {
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  // Get formatted date range strings
  const startDateStr = getUTCDateString(dateRange.startDate);
  const endDateStr = getUTCDateString(dateRange.endDate);

  // Fetch historical data when in history view
  const {
    data: historicalData,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useGetHisaabHistoryQuery(
    {
      startDate: startDateStr,
      endDate: endDateStr,
    },
    {
      skip: activeTab !== "history",
      refetchOnMountOrArgChange: true,
    }
  );

  console.log("Fetching hisaab for date range (UTC):", {
    startDate: startDateStr,
    endDate: endDateStr,
    localStart: formatDateForApi(dateRange.startDate),
    localEnd: formatDateForApi(dateRange.endDate),
  });
  console.log("by date range : ", historicalData);

  // Calculate thali statistics
  const calculateThaliStats = (data) => {
    if (!data)
      return {
        total: 0,
        totalTiffins: 0,
        byPrice: {},
        dailyData: [],
        priceDistribution: {},
        totalRevenue: 0,
        averagePricePerTiffin: 0,
      };

    const stats = {
      total: 0, // Total number of hisaab entries
      totalTiffins: 0, // Total number of tiffins
      byPrice: {}, // Grouped by price point
      dailyData: [], // Daily breakdown
      priceDistribution: {}, // Distribution of tiffins by price
      totalRevenue: 0, // Total revenue from all tiffins
      averagePricePerTiffin: 0, // Average price per tiffin
    };

    // Handle both single hisaab and array of hisaabs
    const hisaabs = Array.isArray(data) ? data : [data];
    stats.total = hisaabs.length;

    hisaabs.forEach((hisaab) => {
      if (!hisaab?.products?.length) return;

      const dailyEntry = {
        date:
          hisaab.formattedDate || new Date(hisaab.date).toLocaleDateString(),
        totalTiffins: hisaab.totalTiffin || 0,
        totalRevenue: hisaab.totalSell || 0,
        priceBreakdown: {},
      };

      // Process each product in the hisaab
      hisaab.products.forEach((product) => {
        if (product.type !== "tiffin") return;

        const price = product.price;
        const count = product.count || 0;

        // Update price distribution
        if (!stats.priceDistribution[price]) {
          stats.priceDistribution[price] = 0;
        }
        stats.priceDistribution[price] += count;

        // Update total tiffins and revenue
        stats.totalTiffins += count;
        stats.totalRevenue += price * count;

        // Update daily price breakdown
        if (!dailyEntry.priceBreakdown[price]) {
          dailyEntry.priceBreakdown[price] = 0;
        }
        dailyEntry.priceBreakdown[price] += count;

        // Update byPrice stats
        if (!stats.byPrice[price]) {
          stats.byPrice[price] = 0;
        }
        stats.byPrice[price] += count;
      });

      stats.dailyData.push(dailyEntry);
    });

    // Calculate average price per tiffin
    if (stats.totalTiffins > 0) {
      stats.averagePricePerTiffin =
        Math.round((stats.totalRevenue / stats.totalTiffins) * 100) / 100;
    }

    // Sort price distribution
    stats.priceDistribution = Object.entries(stats.priceDistribution)
      .sort(([priceA], [priceB]) => priceA - priceB)
      .reduce(
        (acc, [price, count]) => ({
          ...acc,
          [price]: count,
        }),
        {}
      );

    return stats;
  };

  const todayStats = useMemo(
    () => calculateThaliStats(todaysHisaab?.data),
    [todaysHisaab]
  );
  const historyStats = useMemo(
    () => calculateThaliStats(historicalData?.data),
    [historicalData]
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDateRangeChange = (field) => (newValue) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: newValue,
    }));
  };

  const exportToExcel = async () => {
    try {
      setExportLoading(true);
      const response = await fetch("/api/export/thali-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          startDate: dateRange.startDate.toISOString().split("T")[0],
          endDate: dateRange.endDate.toISOString().split("T")[0],
        }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `thali-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      // TODO: Show error toast
    } finally {
      setExportLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderPriceChips = (priceMap) => (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      {Object.entries(priceMap).map(([price, count]) => (
        <Paper
          key={price}
          sx={{
            p: 1,
            minWidth: 80,
            textAlign: "center",
            bgcolor: "primary.light",
            color: "primary.contrastText",
          }}
        >
          <Typography variant="subtitle2">{formatCurrency(price)}</Typography>
          <Typography variant="body2">{count} thalis</Typography>
        </Paper>
      ))}
    </Box>
  );

  const renderMealPlanChips = (mealPlanMap) => (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      {Object.entries(mealPlanMap).map(([plan, count]) => (
        <Chip
          key={plan}
          label={`${plan}: ${count}`}
          color="secondary"
          size="small"
          sx={{ fontWeight: "medium" }}
        />
      ))}
    </Box>
  );

  const renderHistoryTable = () => {
    if (!historyStats.dailyData?.length) {
      return (
        <Box sx={{ mt: 3, textAlign: "center", p: 4 }}>
          <Typography variant="body1" color="textSecondary">
            No thali data available for the selected date range
          </Typography>
        </Box>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell align="right">Total Thalis</TableCell>
              <TableCell>By Price</TableCell>
              <TableCell>By Meal Plan</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {console.log("historyStats", historyStats)}
            {historyStats.dailyData.map((dayData, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  {/* {format(parseISO(dayData.date), "dd MMM yyyy")} */}
                  {dayData.date}
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle1" fontWeight="bold">
                    {dayData.totalTiffins}
                  </Typography>
                </TableCell>
                <TableCell>
                  {renderPriceChips(dayData?.priceBreakdown)}
                </TableCell>
                {/* <TableCell>{renderMealPlanChips(dayData.byMealPlan)}</TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const isLoading = activeTab === "today" ? isLoadingToday : isLoadingHistory;
  const error =
    activeTab === "today" ? todaysHisaab?.error : historicalData?.error;
  const currentStats = activeTab === "today" ? todayStats : historyStats;

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading thali data: {error.message || "Unknown error"}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3, m: 20 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="thali view tabs"
          variant="fullWidth"
        >
          <Tab label="Today's Thali" value="today" />
          <Tab label="Thali History" value="history" />
        </Tabs>
      </Box>

      {activeTab === "today" ? (
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h5" gutterBottom>
              Today's Thali Overview
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={exportToExcel}
              startIcon={<DownloadIcon />}
              disabled={exportLoading}
            >
              {exportLoading ? "Exporting..." : "Export to Excel"}
            </Button>
          </Box>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card elevation={3} sx={{ height: "100%" }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Thalis Today
                  </Typography>
                  <Typography variant="h3" color="primary" fontWeight="bold">
                    {todayStats.total}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card elevation={3} sx={{ height: "100%" }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Thalis by Price
                  </Typography>
                  {todayStats.total > 0 ? (
                    renderPriceChips(todayStats.byPrice)
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No thali data available for today
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            {console.log("todayStats", todayStats)}
            {Object.keys(todayStats?.byPrice)?.length > 0 && (
              <Grid item xs={12}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Thalis by Meal Plan
                    </Typography>
                    {renderMealPlanChips(todayStats.byMealPlan)}
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      ) : (
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", flex: 1 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.startDate}
                  onChange={handleDateRangeChange("startDate")}
                  renderInput={(params) => (
                    <TextField {...params} size="small" />
                  )}
                  maxDate={dateRange.endDate}
                />
                <DatePicker
                  label="End Date"
                  value={dateRange.endDate}
                  onChange={handleDateRangeChange("endDate")}
                  renderInput={(params) => (
                    <TextField {...params} size="small" />
                  )}
                  minDate={dateRange.startDate}
                  maxDate={new Date()}
                />
              </LocalizationProvider>
              <Button
                variant="outlined"
                onClick={() => {
                  activeTab === "today" ? refetchToday() : refetchHistory();
                }}
                disabled={isLoadingHistory}
                startIcon={<RefreshIcon />}
              >
                Refresh
              </Button>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={exportToExcel}
              startIcon={<DownloadIcon />}
              disabled={exportLoading || !historyStats.dailyData?.length}
            >
              {exportLoading ? "Exporting..." : "Export to Excel"}
            </Button>
          </Box>

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card elevation={3}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Thalis
                  </Typography>
                  <Typography variant="h4">{historyStats.total}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {format(dateRange.startDate, "MMM d, yyyy")} -{" "}
                    {format(dateRange.endDate, "MMM d, yyyy")}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card elevation={3}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Thalis by Price (Total)
                  </Typography>
                  {historyStats.total > 0 ? (
                    renderPriceChips(historyStats.byPrice)
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No thali data available for the selected date range
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Thali Summary ({format(dateRange.startDate, "MMM d, yyyy")}{" "}
                    - {format(dateRange.endDate, "MMM d, yyyy")})
                  </Typography>

                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, textAlign: "center" }}>
                        <Typography color="textSecondary">
                          Total Thalis
                        </Typography>
                        <Typography variant="h4">
                          {historyStats.totalTiffins}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={8}>
                      <Paper sx={{ p: 2 }}>
                        <Typography color="textSecondary" gutterBottom>
                          By Price
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                          {Object.entries(historyStats.byPrice).map(
                            ([price, count]) => (
                              <Box
                                key={price}
                                sx={{ textAlign: "center", minWidth: 80 }}
                              >
                                <Typography variant="subtitle2">
                                  ₹{price}
                                </Typography>
                                <Typography variant="h6">{count}</Typography>
                              </Box>
                            )
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* History Table */}
          {renderHistoryTable()}
        </Box>
      )}
    </Box>
  );
};

export default ThaliOverview;
