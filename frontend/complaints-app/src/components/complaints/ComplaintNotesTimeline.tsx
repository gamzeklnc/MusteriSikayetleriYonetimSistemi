'use client';

import { useMemo, useState } from 'react';
import { complaintService } from '@/services/complaintService';
import { ComplaintHistoryDto } from '@/types/complaint';
import { useAuthStore } from '@/store/authStore';

interface Props {
    complaintId: number;
    history: ComplaintHistoryDto[];
    onHistoryUpdated?: () => Promise<void> | void;
    title?: string;
}

export default function ComplaintNotesTimeline({
    complaintId,
    history,
    onHistoryUpdated,
    title = 'Not Geçmişi'
}: Props) {
    const { user } = useAuthStore();
    const canEdit = user?.role === 'Admin' || user?.departmentId === 5;
    const [editingId, setEditingId] = useState<number | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [draftNote, setDraftNote] = useState('');
    const [saving, setSaving] = useState(false);

    const noteItems = useMemo(
        () => history.filter((item) => item.note && item.note.trim().length > 0),
        [history]
    );

    const formatDateTime = (value: string) =>
        new Date(value).toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

    const getPreview = (note?: string) => {
        if (!note) return '';
        return note.replace(/\s+/g, ' ').trim();
    };

    const startEditing = (item: ComplaintHistoryDto) => {
        setEditingId(item.id);
        setExpandedId(item.id);
        setDraftNote(item.note || '');
    };

    const handleSave = async () => {
        if (editingId === null) return;

        try {
            setSaving(true);
            await complaintService.updateNote(complaintId, editingId, { note: draftNote });
            setEditingId(null);
            if (onHistoryUpdated) {
                await onHistoryUpdated();
            }
        } catch (error) {
            console.error('Not guncellenemedi:', error);
            alert('Not güncellenirken bir hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{title}</h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                        Notu açmak için satıra tıklayın.
                    </p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 border border-slate-200">
                    {noteItems.length} not
                </span>
            </div>

            {noteItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4 text-center text-sm text-slate-400">
                    Henüz kayıtlı not bulunmuyor.
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {noteItems.map((item, index) => {
                        const isEditing = editingId === item.id;
                        const isExpanded = expandedId === item.id;

                        return (
                            <div
                                key={item.id}
                                className={index !== noteItems.length - 1 ? 'border-b border-slate-100' : ''}
                            >
                                <button
                                    type="button"
                                    onClick={() => !isEditing && setExpandedId(isExpanded ? null : item.id)}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="truncate text-sm font-semibold text-slate-800">
                                                {item.changedByName}
                                            </span>
                                            {item.departmentName && (
                                                <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                                                    {item.departmentName}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1 truncate text-xs text-slate-500">
                                            {getPreview(item.note)}
                                        </div>
                                    </div>

                                    <div className="shrink-0 text-right">
                                        <div className="text-[11px] font-medium text-slate-500">
                                            {formatDateTime(item.changedAt)}
                                        </div>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3">
                                        {isEditing ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={draftNote}
                                                    onChange={(e) => setDraftNote(e.target.value)}
                                                    className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                />
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingId(null)}
                                                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
                                                    >
                                                        Vazgeç
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleSave}
                                                        disabled={saving}
                                                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                                                    >
                                                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                                                    {item.note}
                                                </div>
                                                {canEdit && (
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => startEditing(item)}
                                                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                                        >
                                                            IT Düzenle
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
