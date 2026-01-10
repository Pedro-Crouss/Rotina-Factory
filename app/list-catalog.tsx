import React, { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Modal, TextInput } from "react-native"
import { useRouter } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect } from "expo-router"

interface List {
  id: string
  name: string
  items: string[]
}

export default function ListCatalogScreen() {
  const router = useRouter()
  const [lists, setLists] = useState<List[]>([])
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingListId, setEditingListId] = useState<string>("")
  const [editingListName, setEditingListName] = useState<string>("")

  useFocusEffect(
    React.useCallback(() => {
      const loadLists = async () => {
        try {
          const saved = await AsyncStorage.getItem("lists")
          if (saved) {
            setLists(JSON.parse(saved))
          } else {
            setLists([])
          }
        } catch (error) {
          console.error("Erro ao carregar listas:", error)
          setLists([])
        }
      }
      loadLists()
    }, []),
  )

  const handleDelete = (id: string) => {
    Alert.alert("Excluir", "Tem certeza que deseja excluir esta lista?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          const newLists = lists.filter((l) => l.id !== id)
          setLists(newLists)
          await AsyncStorage.setItem("lists", JSON.stringify(newLists))
        },
      },
    ])
  }

  const handleEditName = (id: string, currentName: string) => {
    setEditingListId(id)
    setEditingListName(currentName)
    setEditModalVisible(true)
  }

  const handleSaveEditedName = async () => {
    if (editingListName && editingListName.trim()) {
      const updatedLists = lists.map((list) =>
        list.id === editingListId ? { ...list, name: editingListName.trim() } : list,
      )
      setLists(updatedLists)
      await AsyncStorage.setItem("lists", JSON.stringify(updatedLists))
      setEditModalVisible(false)
      setEditingListName("")
      setEditingListId("")
    } else {
      Alert.alert("Atenção", "Por favor, digite um nome válido")
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Crie a sua lista de rotina</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => router.push("/(tabs)/new-list-name")}>
          <Text style={styles.createButtonText}>Criar</Text>
          <Text style={styles.plus}> ＋ </Text>
        </TouchableOpacity>
        <Text style={styles.subtitle}>Listas feitas</Text>
        <View style={styles.divider} />
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listItem}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/edit-list",
                  params: { listId: item.id, name: item.name },
                })
              }
            >
              <Text style={styles.listName}>{item.name}</Text>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.editIcon}
                  onPress={(e) => {
                    e.stopPropagation()
                    handleEditName(item.id, item.name)
                  }}
                >
                  <Text style={styles.iconText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteIcon}
                  onPress={(e) => {
                    e.stopPropagation()
                    handleDelete(item.id)
                  }}
                >
                  <Text style={styles.iconText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ gap: 12 }}
        />
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Nome da Lista</Text>
            <TextInput
              style={styles.modalInput}
              value={editingListName}
              onChangeText={setEditingListName}
              placeholder="Digite o novo nome"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setEditModalVisible(false)
                  setEditingListName("")
                  setEditingListId("")
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveEditedName}>
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#757575",
  },
  content: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    margin: 8,
    marginTop: 50,
  },
  title: {
    color: "#ffffffff",
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "monospace",
    marginBottom: 17,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#A77B8C",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 24,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "monospace",
    marginRight: 8,
  },
  plus: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "monospace",
    marginBottom: 4,
  },
  divider: {
    height: 2,
    backgroundColor: "#fff",
    marginBottom: 16,
    width: "100%",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    padding: 12,
    justifyContent: "space-between",
  },
  listName: {
    color: "#222",
    fontFamily: "monospace",
    fontSize: 16,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editIcon: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: "#A77B8C",
  },
  deleteIcon: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: "#A77B8C",
  },
  iconText: {
    fontSize: 20,
    color: "#A77B8C",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "monospace",
    color: "#222",
    marginBottom: 16,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 2,
    borderColor: "#A77B8C",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    fontFamily: "monospace",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#E0E0E0",
  },
  cancelButtonText: {
    color: "#222",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  saveButton: {
    backgroundColor: "#A77B8C",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
})
