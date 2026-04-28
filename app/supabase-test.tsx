import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { supabase } from '@/utils/supabase';

type Todo = {
  id: number;
  name: string;
};

export default function SupabaseTestScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    const getTodos = async () => {
      try {
        const { data, error } = await supabase.from('todos').select('id, name');

        if (error) {
          console.error('Error fetching todos:', error.message);
          return;
        }

        if (data && data.length > 0) {
          setTodos(data as Todo[]);
        }
      } catch (error: any) {
        console.error('Error fetching todos:', error?.message);
      }
    };

    getTodos();
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white p-6 dark:bg-zinc-950">
      <Text className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">Todo List</Text>
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text className="py-1 text-zinc-700 dark:text-zinc-300">{item.name}</Text>
        )}
        ListEmptyComponent={
          <Text className="text-zinc-500 dark:text-zinc-400">
            No todos found. Add rows to `todos` table.
          </Text>
        }
      />
    </View>
  );
}
