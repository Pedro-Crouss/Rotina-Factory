"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useRouter } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"

export default function NewListNameScreen() {
  const router = useRouter()
  const [listName, setListName] = useState("")

  const handleCreate = async () => {
    if (!listName.trim()) {
      Alert.alert("Atenção", "Por favor, digite um nome para a lista")
      return
    }

    try {
      const saved = await AsyncStorage.getItem("lists")
      const lists = saved ? JSON.parse(saved) : []

      const newList = {
        id: Date.now().toString(),
        name: listName,
        items: [],
      }

      lists.push(newList)
      await AsyncStorage.setItem("lists", JSON.stringify(lists))

      router.push({
        pathname: "/(tabs)/edit-list",
        params: { listId: newList.id, name: newList.name },
      })
    } catch (error) {
      console.error("Erro ao criar lista:", error)
      Alert.alert("Erro", "Não foi possível criar a lista")
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Nome da lista</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite o nome da lista"
          placeholderTextColor="#999"
          value={listName}
          onChangeText={setListName}
        />
        <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
          <Text style={styles.createButtonText}>Criar Lista</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#757575",
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: 10,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "monospace",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    fontFamily: "monospace",
    color: "#222",
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: "#A77B8C",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  cancelButton: {
    backgroundColor: "#555",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "monospace",
  },
})
