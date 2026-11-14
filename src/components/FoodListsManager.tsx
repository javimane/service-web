"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ListPlus, Loader2 } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import { commerceService, type FoodList } from "@/services/commerceService";
import { foodListsQueryKey } from "./FoodOptionsEditor";
import "./FoodOptionsEditor.css";

export default function FoodListsManager() {
  const [open, setOpen] = useState(false);
  const [editingList, setEditingList] = useState<FoodList | null>(null);
  const queryClient = useQueryClient();
  const {
    data: lists = [],
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: foodListsQueryKey,
    queryFn: commerceService.foodLists,
    enabled: open,
  });
  const save = useMutation({
    mutationFn: (list: FoodList) => commerceService.saveFoodList(list),
    onSuccess: (saved) => {
      queryClient.setQueryData<FoodList[]>(
        foodListsQueryKey,
        (current = []) => [
          ...current.filter((list) => list.id !== saved.id),
          saved,
        ],
      );
      void queryClient.invalidateQueries({ queryKey: ["food-options"] });
      setEditingList(null);
    },
  });

  const availability = useMutation({
    mutationFn: ({
      listId,
      optionId,
      enabled,
    }: {
      listId: string;
      optionId: string;
      enabled: boolean;
    }) => commerceService.setFoodOptionAvailability(listId, optionId, enabled),
    onSuccess: (saved, { optionId }) => {
      queryClient.setQueryData<FoodList[]>(foodListsQueryKey, (current = []) =>
        current.map((list) => (list.id === saved.id ? saved : list)),
      );
      void queryClient.invalidateQueries({ queryKey: ["food-options"] });
      const updated = saved.options.find((option) => option.id === optionId);
      if (!updated) return;
      setEditingList((current) =>
        current?.id === saved.id
          ? {
              ...current,
              options: current.options.map((option) =>
                option.id === optionId
                  ? { ...option, enabled: updated.enabled }
                  : option,
              ),
            }
          : current,
      );
    },
  });

  function edit(list: FoodList | null) {
    save.reset();
    availability.reset();
    setEditingList(list);
  }

  return (
    <>
      <button
        type="button"
        className="food-options__launcher"
        onClick={() => setOpen(true)}
      >
        <ListPlus size={18} aria-hidden="true" /> Listas compartidas Para
        Comidas
      </button>
      {open && (
        <Modal
          isOpen
          onClose={() => {
            if (save.isPending || availability.isPending) return;
            edit(null);
            setOpen(false);
          }}
          title="Listas compartidas"
        >
          <div className="food-options">
            <p>
              Creá listas de sabores, extras o acompañamientos para usar en
              distintas comidas.
            </p>
            {isPending && !isError && <p role="status">Cargando listas…</p>}
            {isError && (
              <p role="alert">
                No se pudieron cargar las listas.{" "}
                <button
                  type="button"
                  disabled={isFetching}
                  onClick={() => void refetch()}
                >
                  {isFetching && (
                    <Loader2
                      size={16}
                      className="btn-spinner"
                      aria-hidden="true"
                    />
                  )}{" "}
                  {isFetching ? "Cargando…" : "Reintentar"}
                </button>
              </p>
            )}
            {!editingList ? (
              <>
                {lists.map((list) => (
                  <div className="food-options__list" key={list.id}>
                    <span>
                      <strong>{list.name}</strong> · {list.options.length}{" "}
                      opciones
                    </span>
                    <button type="button" onClick={() => edit(list)}>
                      Editar
                    </button>
                  </div>
                ))}
                <div className="food-options__actions">
                  <button
                    type="button"
                    data-action-tone="add"
                    onClick={() =>
                      edit({ id: crypto.randomUUID(), name: "", options: [] })
                    }
                  >
                    Nueva lista
                  </button>
                </div>
              </>
            ) : (
              <fieldset
                className="food-options__group"
                disabled={save.isPending || availability.isPending}
              >
                <legend>
                  {lists.some((list) => list.id === editingList.id)
                    ? "Editar lista"
                    : "Nueva lista"}
                </legend>
                <p>
                  La disponibilidad de las opciones guardadas se actualiza al
                  tocar el botón.
                </p>
                {availability.isError && (
                  <p role="alert">{availability.error.message}</p>
                )}
                <label>
                  Nombre de la lista{" "}
                  <input
                    value={editingList.name}
                    onChange={(event) =>
                      setEditingList({
                        ...editingList,
                        name: event.target.value,
                      })
                    }
                  />
                </label>
                {editingList.options.map((option) => {
                  const change = (values: Partial<typeof option>) =>
                    setEditingList({
                      ...editingList,
                      options: editingList.options.map((entry) =>
                        entry.id === option.id
                          ? { ...entry, ...values }
                          : entry,
                      ),
                    });
                  return (
                    <div key={option.id}>
                      <label>
                        Opción{" "}
                        <input
                          value={option.name}
                          onChange={(event) =>
                            change({ name: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        Recargo base{" "}
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={option.price}
                          onChange={(event) =>
                            change({ price: Number(event.target.value) })
                          }
                        />
                      </label>
                      <div className="food-options__actions">
                        <span role="status">
                          {option.enabled ? "Disponible" : "Agotada"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              lists.some(
                                (list) =>
                                  list.id === editingList.id &&
                                  list.options.some(
                                    (entry) => entry.id === option.id,
                                  ),
                              )
                            ) {
                              availability.mutate({
                                listId: editingList.id,
                                optionId: option.id,
                                enabled: !option.enabled,
                              });
                            } else {
                              change({ enabled: !option.enabled });
                            }
                          }}
                        >
                          {option.enabled
                            ? "Marcar como agotada"
                            : "Volver a habilitar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="food-options__actions">
                  <button
                    type="button"
                    data-action-tone="add"
                    disabled={editingList.options.length >= 50}
                    onClick={() =>
                      setEditingList({
                        ...editingList,
                        options: [
                          ...editingList.options,
                          {
                            id: crypto.randomUUID(),
                            name: "",
                            price: 0,
                            enabled: true,
                          },
                        ],
                      })
                    }
                  >
                    Agregar opción
                  </button>
                  <button
                    type="button"
                    data-action-tone="cancel"
                    onClick={() => edit(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={
                      !editingList.name.trim() ||
                      !editingList.options.length ||
                      editingList.options.some((option) => !option.name.trim())
                    }
                    onClick={() => save.mutate(editingList)}
                  >
                    {save.isPending && (
                      <Loader2
                        size={16}
                        className="btn-spinner"
                        aria-hidden="true"
                      />
                    )}
                    {save.isPending ? "Guardando…" : "Guardar lista"}
                  </button>
                </div>
                {save.isError && <p role="alert">{save.error.message}</p>}
              </fieldset>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
