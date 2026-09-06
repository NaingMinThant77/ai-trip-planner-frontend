import { FamilyMember } from '../types/api';
import { api } from './client';

export async function listFamily(): Promise<FamilyMember[]> {
  const { data } = await api.get<FamilyMember[]>('/family');
  return data;
}

export async function addFamilyMember(code: string): Promise<FamilyMember> {
  const { data } = await api.post<FamilyMember>('/family', { code });
  return data;
}

export async function removeFamilyMember(id: string): Promise<void> {
  await api.delete(`/family/${id}`);
}
