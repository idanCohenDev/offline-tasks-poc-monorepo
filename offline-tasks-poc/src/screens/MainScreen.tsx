import React, { useEffect, useState } from "react";
import { Alert, Button, FlatList, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useQueue } from "../hooks/useQueue";
import { useOfflineMutation } from "../services/apiService";
import queueManager from "../services/queueManager";
import { RequestLog } from "../types";

export const MainScreen = () => {
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { queue, isLoading: queueLoading } = useQueue();
  const { isOnline } = useNetworkStatus();
  const mutation = useOfflineMutation();

  useEffect(() => {
    const unsubscribe = queueManager.subscribeToStatus((update) => {
      setRequestLogs((prev) =>
        prev.map((log) => (log.queueId === update.queueId ? { ...log, status: update.status, attemptCount: update.attemptCount } : log))
      );
    });

    return unsubscribe;
  }, []);

  const handleSendRequest = async () => {
    const timestamp = new Date().toISOString();
    const logId = Math.random().toString(36).substr(2, 9);

    setRequestLogs((prev) => [
      {
        id: logId,
        url: "/records",
        method: "POST",
        status: "pending",
        timestamp,
        attemptCount: 0,
      },
      ...prev,
    ]);

    mutation.mutate(
      {
        url: "/records",
        method: "POST",
        body: {
          value: `Test value created at ${timestamp}`,
          metadata: {
            source: "mobile-app",
            deviceType: "expo-poc",
          },
        },
        headers: {
          "Content-Type": "application/json",
        },
      },
      {
        onSuccess: () => {
          setRequestLogs((prev) => prev.map((log) => (log.id === logId ? { ...log, status: "sent" } : log)));
          Alert.alert("Success", "Request sent successfully!");
        },
        onError: (error) => {
          if (error.message.includes("queued")) {
            const queueIdMatch = error.message.match(/ID: (.+)$/);
            const queueId = queueIdMatch ? queueIdMatch[1] : undefined;

            setRequestLogs((prev) => prev.map((log) => (log.id === logId ? { ...log, status: "pending", queueId } : log)));
            Alert.alert("Queued", "Request queued for later delivery (offline)");
          } else {
            Alert.alert("Error", error.message);
          }
        },
      }
    );
  };

  const handleDrainQueue = async () => {
    await queueManager.drainQueue();
    Alert.alert("Queue", "Attempted to drain queue");
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await queueManager.drainQueue();
    setRefreshing(false);
  };

  const getStatusColor = (status: RequestLog["status"]) => {
    switch (status) {
      case "sent":
        return "#4CAF50";
      case "pending":
        return "#FF9800";
      case "failed":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Offline-First POC</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: isOnline ? "#4CAF50" : "#F44336" }]} />
            <Text style={styles.statusText}>{isOnline ? "Online" : "Offline"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Button title="Send Request" onPress={handleSendRequest} color="#2196F3" />
          {queue.length > 0 && (
            <View style={styles.drainButton}>
              <Button title={`Drain Queue (${queue.length} items)`} onPress={handleDrainQueue} color="#FF9800" />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Queue Status</Text>
          <View style={styles.queueInfo}>
            <Text style={styles.queueText}>Queued Requests: {queue.length}</Text>
            {queue.length > 0 && (
              <FlatList
                data={queue}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.queueItem}>
                    <Text style={styles.queueItemText}>
                      {item.method} {item.url}
                    </Text>
                    <Text style={styles.queueItemMeta}>
                      Attempts: {item.attemptCount} | {new Date(item.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>
                )}
                style={styles.queueList}
              />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request Log</Text>
          {requestLogs.length === 0 ? (
            <Text style={styles.emptyText}>No requests sent yet</Text>
          ) : (
            <FlatList
              data={requestLogs}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.logItem}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logMethod}>{item.method}</Text>
                    <View style={[styles.logStatus, { backgroundColor: getStatusColor(item.status) }]}>
                      <Text style={styles.logStatusText}>{item.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.logUrl}>{item.url}</Text>
                  <Text style={styles.logTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
                </View>
              )}
              style={styles.logList}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: "#2196F3",
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    color: "white",
    fontSize: 16,
  },
  section: {
    backgroundColor: "white",
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  drainButton: {
    marginTop: 10,
  },
  queueInfo: {
    marginTop: 5,
  },
  queueText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  queueList: {
    maxHeight: 150,
  },
  queueItem: {
    backgroundColor: "#FFF3E0",
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: "#FF9800",
  },
  queueItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  queueItemMeta: {
    fontSize: 12,
    color: "#666",
    marginTop: 3,
  },
  logList: {
    maxHeight: 300,
  },
  logItem: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: "#2196F3",
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  logMethod: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  logStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
  },
  logStatusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
  },
  logUrl: {
    fontSize: 13,
    color: "#666",
  },
  logTime: {
    fontSize: 11,
    color: "#999",
    marginTop: 3,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    padding: 20,
  },
});
