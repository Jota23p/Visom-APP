// App.tsx - React Native com Expo
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';
import { Circle, Ellipse, Path, Svg } from 'react-native-svg';

// Configuração de notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function SmartDoorbellApp() {
  const [isConnected, setIsConnected] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [connectionType, setConnectionType] = useState('wifi');
  const [esp32IP, setEsp32IP] = useState('192.168.1.100');
  const [notificationPermission, setNotificationPermission] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const wsRef = useRef(null);

  useEffect(() => {
    // Solicitar permissão de notificação
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationPermission(status === 'granted');
    })();

    // Animação de pulso quando não pressionado
    if (!isPressed) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isPressed]);

  const connectWiFi = () => {
    try {
      const ws = new WebSocket(`ws://${esp32IP}:81`);
      
      ws.onopen = () => {
        setIsConnected(true);
        wsRef.current = ws;
        Alert.alert('Sucesso', 'Conectado à campainha!');
      };

      ws.onmessage = (event) => {
        if (event.data === 'BELL_PRESSED') {
          handleDoorbellPress();
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        Alert.alert('Desconectado', 'Conexão perdida');
      };

      ws.onerror = () => {
        Alert.alert('Erro', 'Falha na conexão. Verifique o IP.');
      };
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão. Verifique o IP da Campainha.');
    }
  };

  const handleDoorbellPress = async () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Adicionar ao histórico
    setNotifications(prev => [{
      id: Date.now(),
      time: timeStr,
      date: 'Hoje',
      calls: 1
    }, ...prev.slice(0, 19)]);

    // Animação visual
    setIsPressed(true);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => setIsPressed(false), 3000);

    // Vibração (mais forte no Android)
    if (vibrationEnabled) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 200);
        setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 400);
      } else {
        Vibration.vibrate([0, 400, 100, 400, 100, 400]);
      }
    }

    // Som
    if (soundEnabled) {
      playDoorbellSound();
    }

    // Notificação Push
    if (notificationPermission) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Visitante na Porta!',
          body: 'Alguém tocou a campainha agora',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: [0, 400, 100, 400],
        },
        trigger: null, // Imediato
      });
    }
  };

  const playDoorbellSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
        { shouldPlay: true, volume: 1.0 }
      );
      
      setTimeout(() => {
        sound.unloadAsync();
      }, 2000);
    } catch (error) {
      console.log('Erro ao tocar som:', error);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setIsConnected(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <View style={styles.headerRight}>
          {notificationPermission && (
            <View style={styles.notificationBadge}>
              <View style={styles.notificationDot} />
              <Text style={styles.notificationText}>Notificações Ativas</Text>
            </View>
          )}
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3D Doorbell - Interactive */}
      <View style={styles.doorbellContainer}>
        <TouchableOpacity 
          onPress={handleDoorbellPress}
          activeOpacity={0.8}
        >
          <Animated.View style={[
            styles.doorbellWrapper,
            { transform: [{ scale: scaleAnim }] }
          ]}>
            <Svg width={280} height={280} viewBox="0 0 200 200">
              {/* Base/Wall */}
              <Path d="M100 170 L30 135 L30 65 L100 100 Z" fill="#475569" opacity="0.9"/>
              <Path d="M100 170 L170 135 L170 65 L100 100 Z" fill="#334155" opacity="0.95"/>
              <Path d="M100 100 L30 65 L100 30 L170 65 Z" fill="#64748B" opacity="0.8"/>
              
              {/* Bell Housing */}
              <Ellipse cx="100" cy="85" rx="30" ry="15" fill="#94A3B8" opacity="0.9"/>
              <Path 
                d="M70 85 L70 110 Q70 122 82 128 L118 128 Q130 122 130 110 L130 85 Z" 
                fill={isPressed ? "#EF4444" : "#E2E8F0"}
              />
              <Path d="M70 85 L70 110 Q70 122 82 128 L82 100 Z" fill={isPressed ? "#DC2626" : "#CBD5E1"} opacity="0.6"/>
              
              {/* Bell Icon */}
              <Path d="M92 95 L92 110 L85 116 L115 116 L108 110 L108 95 Q108 90 100 90 Q92 90 92 95 Z" fill={isPressed ? "#FECACA" : "#475569"}/>
              <Circle cx="100" cy="118" r="3.5" fill={isPressed ? "#FEE2E2" : "#1E293B"}/>
              
              {/* Button */}
              <Ellipse cx="100" cy="145" rx="22" ry="11" fill="#1E293B" opacity="0.9"/>
              <Ellipse cx="100" cy="143" rx="18" ry="9" fill={isPressed ? "#10B981" : "#3B82F6"}/>
              <Ellipse cx="100" cy="141" rx="12" ry="5" fill="white" opacity="0.4"/>
            </Svg>
          </Animated.View>
        </TouchableOpacity>
        
        {!isPressed && (
          <View style={styles.tapInstruction}>
            <Text style={styles.tapText}>Toque para testar</Text>
          </View>
        )}
      </View>

      {/* Alert Banner */}
      {isPressed && (
        <View style={styles.alertBanner}>
          <View style={styles.alertIcon}>
            <Ionicons name="notifications" size={28} color="#fff" />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Visitante na Porta!</Text>
            <Text style={styles.alertSubtitle}>Alguém tocou a campainha</Text>
          </View>
        </View>
      )}

      {/* Connection Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.iconContainer, styles.blueGradient]}>
              <Ionicons name={connectionType === 'wifi' ? 'wifi' : 'bluetooth'} size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.cardTitle}>
                {isConnected ? 'Campainha' : 'Campainha'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </Text>
            </View>
          </View>
          {isConnected && (
            <TouchableOpacity onPress={disconnect} style={styles.disconnectButton}>
              <Text style={styles.disconnectText}>Desconectar</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isConnected && (
          <View style={styles.connectionForm}>
            <View style={styles.connectionTypeButtons}>
              <TouchableOpacity
                onPress={() => setConnectionType('wifi')}
                style={[styles.typeButton, connectionType === 'wifi' && styles.typeButtonActive]}
              >
                <Text style={[styles.typeButtonText, connectionType === 'wifi' && styles.typeButtonTextActive]}>
                  WiFi
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setConnectionType('bluetooth')}
                style={[styles.typeButton, connectionType === 'bluetooth' && styles.typeButtonActive]}
              >
                <Text style={[styles.typeButtonText, connectionType === 'bluetooth' && styles.typeButtonTextActive]}>
                  Bluetooth
                </Text>
              </TouchableOpacity>
            </View>

            {connectionType === 'wifi' && (
              <TextInput
                value={esp32IP}
                onChangeText={setEsp32IP}
                placeholder="192.168.1.100"
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.ipInput}
              />
            )}
            
            <TouchableOpacity onPress={connectWiFi} style={styles.connectButton}>
              <Text style={styles.connectButtonText}>Conectar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Vibration Card */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.iconContainer, styles.pinkGradient]}>
              <Ionicons name="phone-portrait" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Vibração</Text>
              <Text style={styles.cardSubtitle}>Alerta no celular</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setVibrationEnabled(!vibrationEnabled)}
            style={[styles.toggleButton, vibrationEnabled && styles.toggleButtonActive]}
          >
            <Text style={[styles.toggleText, vibrationEnabled && styles.toggleTextActive]}>
              {vibrationEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sound Card */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.iconContainer, styles.greenGradient]}>
              <Ionicons name="volume-high" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Som</Text>
              <Text style={styles.cardSubtitle}>Toque da campainha</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setSoundEnabled(!soundEnabled)}
            style={[styles.toggleButton, soundEnabled && styles.toggleButtonActive]}
          >
            <Text style={[styles.toggleText, soundEnabled && styles.toggleTextActive]}>
              {soundEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Test Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Toque na campainha acima para testar os alertas
        </Text>
      </View>

      {/* Notification Permission Warning */}
      {!notificationPermission && (
        <View style={styles.warningCard}>
          <Ionicons name="notifications-outline" size={20} color="#fb923c" />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Ativar Notificações em Segundo Plano</Text>
            <Text style={styles.warningText}>
              Permita notificações para receber alertas mesmo com o app fechado
            </Text>
            <TouchableOpacity
              onPress={async () => {
                const { status } = await Notifications.requestPermissionsAsync();
                setNotificationPermission(status === 'granted');
              }}
              style={styles.warningButton}
            >
              <Text style={styles.warningButtonText}>Permitir Notificações</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* History */}
      <View style={styles.card}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Histórico</Text>
          <Text style={styles.historyCount}>{notifications.length} alertas</Text>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="notifications-outline" size={48} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>Nenhum alerta ainda</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {notifications.map(notif => (
              <TouchableOpacity key={notif.id} style={styles.historyItem}>
                <View style={[styles.historyIcon, styles.blueGradient]}>
                  <Ionicons name="notifications" size={20} color="#fff" />
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyTime}>{notif.time}, {notif.date}</Text>
                  <Text style={styles.historyCalls}>
                    {notif.calls} chamado{notif.calls > 1 ? 's' : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 4,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
  },
  notificationText: {
    color: '#86efac',
    fontSize: 12,
    fontWeight: '500',
  },
  settingsButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doorbellContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  doorbellWrapper: {
    width: 280,
    height: 280,
  },
  tapInstruction: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginTop: -30,
  },
  tapText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    gap: 16,
  },
  alertIcon: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
    justifyContent: 'center',
  },
  alertTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  alertSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: {
    gap: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blueGradient: {
    backgroundColor: '#3b82f6',
  },
  pinkGradient: {
    backgroundColor: '#ec4899',
  },
  greenGradient: {
    backgroundColor: '#10b981',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  disconnectButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  disconnectText: {
    color: '#fca5a5',
    fontWeight: '500',
  },
  connectionForm: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  connectionTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  typeButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#93c5fd',
  },
  ipInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  connectButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.3)',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  toggleText: {
    color: '#9ca3af',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#86efac',
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  infoText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
  },
  warningCard: {
    backgroundColor: 'rgba(251, 146, 60, 0.2)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.3)',
    flexDirection: 'row',
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    color: '#fcd34d',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  warningText: {
    color: 'rgba(252, 211, 77, 0.8)',
    fontSize: 12,
    marginBottom: 12,
  },
  warningButton: {
    backgroundColor: '#fb923c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  warningButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  historyCount: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    marginTop: 8,
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyContent: {
    flex: 1,
  },
  historyTime: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  historyCalls: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
});