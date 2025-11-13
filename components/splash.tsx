import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";

interface BetaStatus {
  active: boolean;
  version: string;
  expiry_date: string | null;
  message: string;
}

const APP_ID = "1"; // <- hier änderst du den Namen je App (ecoflow)

const SplashScreen: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
  const [status, setStatus] = useState<BetaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const [isConnectionError, setIsConnectionError] = useState(false);

  const addLog = (message: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const checkBetaStatus = useCallback(() => {
    setLoading(true);
    setIsConnectionError(false);
    setLog([]);
    addLog("Prüfe Serverstatus...");

    // IMPORTANT: Adjust this URL to your actual API endpoint
    fetch(`https://mb-apps.de.cool/api/check-beta.php?app_id=${APP_ID}`)
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Serverantwort: ${res.status} ${res.statusText}. Details: ${errorText}`);
        }
        return res.json();
      })
      .then((data) => {
        addLog("Server-Antwort erhalten.");
        setStatus(data);
        setLoading(false);

        if (data.active) {
          addLog("Beta-Status: Aktiv. App wird gestartet...");
          setTimeout(onContinue, 2000);
        } else {
          addLog("Beta-Status: Inaktiv.");
        }
      })
      .catch((error) => {
        addLog(`Fehler: ${error.message}`);
        setStatus({
          active: false,
          version: "-",
          expiry_date: null,
          message: "Verbindungsfehler zum Server.",
        });
        setLoading(false);
        setIsConnectionError(true);
      });
  }, [onContinue]);

  useEffect(() => {
    checkBetaStatus();
  }, [checkBetaStatus]);

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        <Text style={styles.title}>🚧 Beta-Version 🚧</Text>

        {loading && <ActivityIndicator size="large" color="#fff" />}

        {!loading && status && (
          <>
            <Text style={styles.message}>{status.message}</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Version: <Text style={styles.bold}>{status.version}</Text>
              </Text>
              {status.expiry_date && (
                <Text style={styles.infoText}>
                  Läuft bis:{" "}
                  <Text style={styles.bold}>
                    {new Date(status.expiry_date).toLocaleDateString("de-DE")}
                  </Text>
                </Text>
              )}
            </View>
          </>
        )}

        {isConnectionError && !loading && (
          <>
            <Text style={styles.errorText}>
              Verbindung fehlgeschlagen.
            </Text>
            <TouchableOpacity style={styles.button} onPress={checkBetaStatus}>
              <Text style={styles.buttonText}>Erneut versuchen</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {isConnectionError && (
        <View style={styles.logContainer}>
          <Text style={styles.logTitle}>Konsole:</Text>
          <ScrollView style={styles.logScrollView}>
            {log.map((msg, index) => (
              <Text key={index} style={styles.logText}>
                {msg}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#283e51",
    padding: 20,
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
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
    minWidth: "80%",
    alignItems: "center",
  },
  infoText: {
    color: "#fff",
    fontSize: 16,
  },
  bold: {
    fontWeight: "bold",
  },
  errorText: {
    marginTop: 16,
    color: "#ff8080",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  logContainer: {
    flex: 0.5,
    marginTop: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 8,
    padding: 10,
  },
  logTitle: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 5,
  },
  logScrollView: {
    flex: 1,
  },
  logText: {
    color: "#fff",
    fontFamily: "monospace",
    fontSize: 12,
  },
});

export default SplashScreen;