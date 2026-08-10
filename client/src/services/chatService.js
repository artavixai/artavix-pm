import * as signalR from "@microsoft/signalr";
import api from './apiService';
import { CHAT_HUB_URL } from '../config';

class ChatService {
    connection = null;

    startConnection = () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error("No auth token found for SignalR connection");
            return Promise.reject("No token");
        }

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(CHAT_HUB_URL, {
                accessTokenFactory: () => localStorage.getItem('authToken'),
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
            })
            .withAutomaticReconnect()
            .build();

        return this.connection.start();
    }

    stopConnection = () => {
        if (this.connection) {
            return this.connection.stop();
        }
    }

    onReceiveMessage = (callback) => {
        if (this.connection) {
            this.connection.on("ReceiveMessage", callback);
        }
    }

    offReceiveMessage = (callback) => {
        if (this.connection) {
            this.connection.off("ReceiveMessage", callback);
        }
    }

    onMessagesSeen = (callback) => {
        if (this.connection) {
            this.connection.on("MessagesSeen", callback);
        }
    }

    offMessagesSeen = (callback) => {
        if (this.connection) {
            this.connection.off("MessagesSeen", callback);
        }
    }

    markMessagesAsSeen = (channelId) => {
        if (this.connection) {
            return this.connection.invoke("MarkMessagesAsSeen", Number(channelId));
        }
    }

    sendMessage = (channelId, message) => {
        if (this.connection) {
            return this.connection.invoke("SendMessage", Number(channelId), message);
        }
    }

    getUserChannels = () => {
        return api.get('/chat/channels');
    }

    getChannelMessages = (channelId) => {
        return api.get(`/chat/channels/${channelId}/messages`);
    }
}

const chatService = new ChatService();
export default chatService;