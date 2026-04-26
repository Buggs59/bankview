'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getFamiliesAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('user_id', user.id)
    .order('name');

  if (error) {
    console.error('Error fetching families:', error);
    return [];
  }
  return data || [];
}

export async function createFamilyAction(name: string, type: 'expense' | 'income') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non connecté' };

  const { data, error } = await supabase
    .from('families')
    .insert([{ name, type, user_id: user.id }])
    .select()
    .single();

  if (error) {
    console.error('Error creating family:', error);
    return { error: error.message };
  }

  revalidatePath('/config');
  return { success: true, data };
}

export async function deleteFamilyAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('families')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting family:', error);
    return { error: error.message };
  }

  revalidatePath('/config');
  return { success: true };
}

export async function getCategoriesAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('*, families(*)')
    .eq('user_id', user.id)
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data || [];
}

export async function createCategoryAction(name: string, family_id: string, icon?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non connecté' };

  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, family_id, icon, user_id: user.id }])
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    return { error: error.message };
  }

  revalidatePath('/config');
  revalidatePath('/categories');
  return { success: true, data };
}

export async function updateFamilyAction(id: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('families')
    .update({ name })
    .eq('id', id);

  if (error) {
    console.error('Error updating family:', error);
    return { error: error.message };
  }

  revalidatePath('/config');
  return { success: true };
}

export async function deleteCategoryAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    return { error: error.message };
  }

  revalidatePath('/config');
  revalidatePath('/categories');
  return { success: true };
}

export async function updateCategoryAction(id: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id);

  if (error) {
    console.error('Error updating category:', error);
    return { error: error.message };
  }

  revalidatePath('/config');
  revalidatePath('/categories');
  return { success: true };
}
