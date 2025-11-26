<div align="center">

  <img src="assets/images/icon.png" alt="Logo Visom" width="120" />

  # 🔔 VISOM
  ### Sistema de Campainha Inteligente e Acessível

  <p>
    <img src="https://img.shields.io/badge/Status-MVP%20Funcional-green?style=for-the-badge" />
    <img src="https://img.shields.io/badge/Plataforma-Mobile%20(iOS%20%26%20Android)-blue?style=for-the-badge" />
    <img src="https://img.shields.io/badge/Tech-React%20Native%20%7C%20Expo-61DAFB?style=for-the-badge&logo=react" />
  </p>

  <p align="center">
    O <strong>Visom</strong> é uma solução de tecnologia assistiva projetada para promover a autonomia de pessoas com deficiência auditiva e visual. O sistema transforma uma campainha comum em um alerta <strong>multissensorial</strong> (tátil, visual e sonoro) direto no smartphone.
  </p>

</div>

---

## 📱 Funcionalidades

O aplicativo atua como a interface principal do usuário, conectando-se diretamente ao hardware (ESP32) via rede local.

| Recurso | Descrição |
| :--- | :--- |
| 📳 **Alerta Tátil** | Vibração intensa e padronizada para alertar deficientes auditivos (uso da API Haptics). |
| 🔦 **Alerta Visual** | Interface de alto contraste e acionamento do Flash LED (via configurações de acessibilidade). |
| 🔔 **Notificação Push** | Alertas em tempo real mesmo com o aplicativo em segundo plano. |
| 📅 **Histórico de Eventos** | Registro automático com data e hora de cada visita detectada. |
| 📡 **Monitoramento** | Status de conexão em tempo real (Online/Offline) via WebSocket. |

---

## 🛠️ Tecnologias Utilizadas

* **Framework:** [React Native](https://reactnative.dev/)
* **Ferramenta de Build:** [Expo](https://expo.dev/) (Expo Router)
* **Linguagem:** TypeScript / JavaScript
* **Comunicação:** WebSockets (Conexão direta com ESP32)
* **Bibliotecas Chave:**
    * `expo-haptics`: Para controle de vibração.
    * `expo-notifications`: Para alertas locais.
    * `lucide-react-native`: Ícones visuais.

---

## 📸 Screenshots

<div align="center">
  <img src="assets/images/home.jpeg" alt="Tela Principal" width="220" />
  
  &nbsp;&nbsp;&nbsp;&nbsp; <img src="assets/images/alerta.jpeg" alt="Alerta Ativo" width="220" />
</div>
---

## 🚀 Como Rodar o Projeto

Este projeto utiliza o **Expo**. Siga os passos abaixo para executar no seu ambiente:

### Pré-requisitos
* Node.js instalado
* Gerenciador de pacotes (NPM ou Yarn)
* Aplicativo **Expo Go** instalado no celular (Android/iOS)

### Instalação

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/Jota23p/Visom-APP.git](https://github.com/Jota23p/Visom-APP.git)
   cd Visom-APP