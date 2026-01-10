import { Stack } from 'expo-router';
import React from 'react';

export default function TabsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="list-catalog" options={{ title: 'Listas' }} />
      <Stack.Screen name="new-list-name" options={{ title: "Nova Lista" }} />
      <Stack.Screen name="edit-list" options={{ title: 'Editar Lista' }} />
    </Stack>
  );
}
