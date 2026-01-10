import AsyncStorage from "@react-native-async-storage/async-storage"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

interface ListItem {
  text: string
  startTime: string
  endTime: string
  completed: boolean
}

interface List {
  id: string
  name: string
  items: ListItem[]
}

export default function EditListScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const listId = params.listId as string
  const listName = params.name as string

  const [items, setItems] = useState<ListItem[]>([])
  const [newItem, setNewItem] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    loadListItems()
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const loadListItems = async () => {
    try {
      const saved = await AsyncStorage.getItem("lists")
      if (saved) {
        const lists: List[] = JSON.parse(saved)
        const list = lists.find((l) => l.id === listId)
        if (list) {
          setItems(list.items || [])
        }
      }
    } catch (error) {
      console.error("Erro ao carregar itens:", error)
    }
  }

  const saveItems = async (newItems: ListItem[]) => {
    try {
      const saved = await AsyncStorage.getItem("lists")
      if (saved) {
        const lists: List[] = JSON.parse(saved)
        const listIndex = lists.findIndex((l) => l.id === listId)
        if (listIndex !== -1) {
          lists[listIndex].items = newItems
          await AsyncStorage.setItem("lists", JSON.stringify(lists))
          setHasUnsavedChanges(false)
        }
      }
    } catch (error) {
      console.error("Erro ao salvar itens:", error)
    }
  }

  const handleAddItem = () => {
    if (!newItem.trim()) {
      Alert.alert("Atenção", "Por favor, digite um item")
      return
    }

    let initialStartTime = "00:00"
    if (items.length > 0) {
      const lastItem = items[items.length - 1]
      initialStartTime = lastItem.endTime || "00:00"
    }

    const updatedItems = [...items, { text: newItem, startTime: initialStartTime, endTime: "00:00", completed: false }]
    setItems(updatedItems)
    setNewItem("")
    setHasUnsavedChanges(true)
    Keyboard.dismiss()
  }

  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index)
    setItems(updatedItems)
    setHasUnsavedChanges(true)
  }

  const toggleItemCompleted = (index: number) => {
    const updatedItems = [...items]
    updatedItems[index].completed = !updatedItems[index].completed
    setItems(updatedItems)
    setHasUnsavedChanges(true)
  }

  const validateAndFormatTime = (text: string): string => {
    let cleaned = text.replace(/[^0-9:]/g, "")

    if (cleaned.length === 2 && !cleaned.includes(":")) {
      cleaned = cleaned + ":"
    }

    if (cleaned.length > 5) {
      cleaned = cleaned.substring(0, 5)
    }

    if (cleaned.includes(":")) {
      const parts = cleaned.split(":")
      let hours = parts[0]
      let minutes = parts[1] || ""

      if (hours.length >= 2) {
        const h = Number.parseInt(hours)
        if (h > 23) hours = "23"
      }

      if (minutes.length >= 2) {
        const m = Number.parseInt(minutes)
        if (m > 59) minutes = "59"
      }

      cleaned = hours + ":" + minutes
    }

    return cleaned
  }

  const handleUpdateStartTime = (itemIndex: number, newTime: string) => {
    const formatted = validateAndFormatTime(newTime)
    const updatedItems = [...items]
    updatedItems[itemIndex].startTime = formatted
    setItems(updatedItems)
    setHasUnsavedChanges(true)
  }

  const handleUpdateEndTime = (itemIndex: number, newTime: string) => {
    const formatted = validateAndFormatTime(newTime)
    const updatedItems = [...items]
    updatedItems[itemIndex].endTime = formatted
    setItems(updatedItems)
    setHasUnsavedChanges(true)
  }

  const isEndTimePassed = (endTime: string): boolean => {
    if (!endTime || endTime.length < 5) return false

    const [hours, minutes] = endTime.split(":").map(Number)
    if (isNaN(hours) || isNaN(minutes)) return false

    const now = new Date()
    const itemTime = new Date()
    itemTime.setHours(hours, minutes, 0, 0)

    return now > itemTime
  }

  const handleConclude = async () => {
    await saveItems(items)
    Alert.alert("Sucesso", "Lista salva com sucesso!", [
      {
        onPress: () => router.push("/list-catalog"),
      },
    ])
  }

  const handleBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert("Atenção", "Você tem alterações não salvas. Deseja salvar antes de sair?", [
        {
          text: "Não Salvar",
          onPress: () => router.push("/list-catalog"),
          style: "destructive",
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Salvar",
          onPress: async () => {
            await saveItems(items)
            router.push("/list-catalog")
          },
        },
      ])
    } else {
      router.push("/list-catalog")
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{listName}</Text>
          </View>

          <View style={styles.listArea}>
            <View style={styles.addItemContainer}>
              <TextInput
                style={styles.newItemInput}
                placeholder="Novo item"
                placeholderTextColor="#999"
                value={newItem}
                onChangeText={setNewItem}
                returnKeyType="done"
                onSubmitEditing={handleAddItem}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
                <Text style={styles.addButtonText}>＋</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.itemsListContainer}>
              {items.map((item, itemIndex) => {
                const timePassed = isEndTimePassed(item.endTime)
                const shouldBeGreen = item.completed || timePassed

                return (
                  <View key={itemIndex} style={styles.itemRow}>
                    <TouchableOpacity
                      style={[styles.checkbox, item.completed && styles.checkboxChecked]}
                      onPress={() => toggleItemCompleted(itemIndex)}
                    >
                      {item.completed && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>

                    <View style={[styles.itemContainer, shouldBeGreen && styles.itemContainerGreen]}>
                      <TextInput
                        style={styles.itemText}
                        value={item.text}
                        onChangeText={(text) => {
                          const updatedItems = [...items]
                          updatedItems[itemIndex].text = text
                          setItems(updatedItems)
                          setHasUnsavedChanges(true)
                        }}
                        placeholder="Digite o item"
                        placeholderTextColor="#666"
                        multiline
                      />
                      <TouchableOpacity style={styles.removeItemButton} onPress={() => handleRemoveItem(itemIndex)}>
                        <Text style={styles.removeItemText}>×</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.timesContainer}>
                      <TextInput
                        style={[styles.timeInput, shouldBeGreen && styles.timeInputGreen]}
                        value={item.startTime}
                        onChangeText={(text) => handleUpdateStartTime(itemIndex, text)}
                        maxLength={5}
                        placeholder="00:00"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={[styles.timeInput, shouldBeGreen && styles.timeInputGreen]}
                        value={item.endTime}
                        onChangeText={(text) => handleUpdateEndTime(itemIndex, text)}
                        maxLength={5}
                        placeholder="00:00"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                )
              })}
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.concludeButton} onPress={handleConclude}>
              <Text style={styles.buttonText}>Concluir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.buttonText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5A5A5A",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingVertical: 10,
    paddingBottom: 30,
  },
  content: {
    paddingHorizontal: 12,
    width: "100%",
  },
  header: {
    backgroundColor: "#7D6E83",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  listArea: {
    backgroundColor: "#9B8AA4",
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  itemsListContainer: {
    gap: 12,
    marginTop: 15,
  },
  itemRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: "#555",
    backgroundColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  checkboxChecked: {
    backgroundColor: "#81C784",
    borderColor: "#4CAF50",
  },
  checkmark: {
    color: "#1B5E20",
    fontSize: 20,
    fontWeight: "bold",
  },
  itemContainer: {
    flex: 1,
    backgroundColor: "#D4C4DD",
    borderRadius: 12,
    padding: 12,
    minHeight: 55,
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  itemContainerGreen: {
    backgroundColor: "#A5D6A7",
    borderWidth: 2,
    borderColor: "#66BB6A",
  },
  itemText: {
    color: "#222",
    fontSize: 15,
    paddingRight: 30,
    fontWeight: "500",
  },
  removeItemButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#999",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  removeItemText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 22,
  },
  timesContainer: {
    gap: 8,
    alignItems: "flex-end",
  },
  timeInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    minWidth: 70,
    borderWidth: 2,
    borderColor: "#DDD",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  timeInputGreen: {
    backgroundColor: "#C8E6C9",
    borderColor: "#81C784",
  },
  addItemContainer: {
    flexDirection: "row",
    gap: 10,
  },
  newItemInput: {
    flex: 1,
    backgroundColor: "#D4C4DD",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#222",
    fontWeight: "500",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  addButton: {
    backgroundColor: "#7D6E83",
    borderRadius: 12,
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 20,
    backgroundColor: "#9B8AA4",
    padding: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  concludeButton: {
    flex: 1,
    backgroundColor: "#81C784",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  backButton: {
    flex: 1,
    backgroundColor: "#A77B8C",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
})
