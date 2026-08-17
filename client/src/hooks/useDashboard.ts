import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardRepository, DashboardFilterParams, DashboardMetricsData } from '../services/dashboardRepository';

export function useDashboard(initialFilter: DashboardFilterParams = { period_type: 'DAILY' }) {
  const [filter, setFilter] = useState<DashboardFilterParams>(initialFilter);
  const [data, setData] = useState<DashboardMetricsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSseConnected, setIsSseConnected] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const backoffRef = useRef<number>(1000);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<any>(null);

  // Fetch Dashboard Summary Data from Repository
  const fetchMetrics = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setLoading(true);
      setError(null);
      try {
        const metrics = await dashboardRepository.getDashboardSummary(filter);
        setData(metrics);
        setLastUpdated(new Date().toISOString());
      } catch (err: any) {
        setError(err.message || 'Gagal memuat data dashboard.');
      } finally {
        setLoading(false);
      }
    },
    [filter]
  );

  // Fetch data on filter change
  useEffect(() => {
    fetchMetrics(true);
  }, [fetchMetrics]);

  // Connect to SSE Realtime Engine with Reconnection Backoff (1s, 2s, 4s, 8s)
  useEffect(() => {
    let isSubscribed = true;

    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const sseUrl = '/api/events';
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!isSubscribed) return;
        setIsSseConnected(true);
        backoffRef.current = 1000; // Reset backoff delay on successful connection
        // Trigger full dashboard synchronization upon reconnect
        fetchMetrics(false);
      };

      // Listen for all real-time transaction, expense, shift, and settings events
      const handleEventSignal = () => {
        if (!isSubscribed) return;
        fetchMetrics(false);
      };

      es.addEventListener('TRANSACTION_CREATED', handleEventSignal);
      es.addEventListener('EXPENSE_CREATED', handleEventSignal);
      es.addEventListener('SHIFT_OPENED', handleEventSignal);
      es.addEventListener('SHIFT_CLOSED', handleEventSignal);
      es.addEventListener('PRODUCT_UPDATED', handleEventSignal);
      es.addEventListener('SETTINGS_UPDATED', handleEventSignal);
      es.addEventListener('USER_UPDATED', handleEventSignal);

      es.onerror = () => {
        if (!isSubscribed) return;
        setIsSseConnected(false);
        es.close();

        // Exponential backoff reconnect: 1s -> 2s -> 4s -> 8s (max 8s)
        const delay = backoffRef.current;
        backoffRef.current = Math.min(backoffRef.current * 2, 8000);

        reconnectTimerRef.current = setTimeout(() => {
          if (isSubscribed) {
            connectSSE();
          }
        }, delay);
      };
    };

    connectSSE();

    // Auto polling interval fallback (every 30 seconds) to ensure 100% real-time data freshness
    const pollInterval = setInterval(() => {
      if (isSubscribed) {
        fetchMetrics(false);
      }
    }, 30000);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [fetchMetrics]);

  return {
    filter,
    setFilter,
    data,
    loading,
    error,
    isSseConnected,
    lastUpdated,
    refresh: () => fetchMetrics(true),
  };
}
