import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

interface BetaStatus {
  active: boolean;
  version: string;
  expiry_date: string | null;
  message: string;
}

const SplashScreen: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
  const [status, setStatus] = useState<BetaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // IMPORTANT: Adjust this URL to your actual API endpoint. 
    // Using a relative path like "/api/check-beta" might not work in production builds.
    fetch("/api/check-beta") 
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);

        // Continue only if the beta is active
        if (data.active) {
          setTimeout(onContinue, 2000); // Wait 2 seconds before continuing
        }
      })
      .catch(() => {
        setStatus({
          active: false,
          version: "-",
          expiry_date: null,
          message: "Verbindungsfehler zum Server.",
        });
        setLoading(false);
      });
  }, [onContinue]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚧 Beta-Version 🚧</Text>

      {loading && (
        <>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Prüfe Serverstatus …</Text>
        </>
      )}

      {!loading && status && (
        <>
          <Text style={styles.message}>{status.message}</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Version: <Text style={styles.bold}>{status.version}</Text></Text>
            {status.expiry_date && (
              <Text style={styles.infoText}>
                Läuft bis: <Text style={styles.bold}>{new Date(status.expiry_date).toLocaleDateString("de-DE")}</Text>
              </Text>
            )}
          </View>

          {!status.active && (
            <Text style={styles.errorText}>
              Diese Version ist gesperrt oder abgelaufen.
            </Text>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#283e51",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#fff",
    fontSize: 16,
  },
  message: {
    marginTop: 16,
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  infoBox: {
    marginTop: 32,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  infoText: {
    color: "#fff",
    fontSize: 16,
  },
  bold: {
    fontWeight: "bold",
  },
  errorText: {
    marginTop: 32,
    color: "#ff8080",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
});

export default SplashScreen;