"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  commerceService,
  type FoodGroup,
  type FoodList,
} from "@/services/commerceService";
import "./FoodOptionsEditor.css";

export const foodListsQueryKey = ["professional-food-lists"];

export function validateFoodOptions(groups: FoodGroup[]) {
  if (
    groups.length > 12 ||
    groups.some(
      (group) =>
        !group.name.trim() ||
        group.name.length > 100 ||
        group.options.length > 50 ||
        !Number.isInteger(group.min) ||
        !Number.isInteger(group.max) ||
        group.min < 0 ||
        group.max > 50 ||
        group.max < Math.max(1, group.min) ||
        (!group.list_id && group.max > group.options.length) ||
        group.options.some(
          (option) =>
            !option.name.trim() ||
            option.name.length > 100 ||
            option.price > 10000000 ||
            !Number.isFinite(option.price) ||
            option.price < 0,
        ),
    )
  ) {
    throw new Error(
      "Revisá los nombres, límites y recargos de la personalización.",
    );
  }
}

export default function FoodOptionsEditor({
  groups,
  setGroups,
  busy,
}: {
  groups: FoodGroup[];
  setGroups: (groups: FoodGroup[]) => void;
  busy: boolean;
}) {
  const [listId, setListId] = useState("");
  const {
    data: lists = [],
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: foodListsQueryKey,
    queryFn: commerceService.foodLists,
  });
  const availableLists = lists.filter(
    (list) => !groups.some((group) => group.list_id === list.id),
  );
  const selectedList = availableLists.find((list) => list.id === listId);

  function update(index: number, group: FoodGroup) {
    setGroups(
      groups.map((entry, position) => (position === index ? group : entry)),
    );
  }

  function assignList(list: FoodList) {
    setGroups([
      ...groups,
      {
        name: list.name,
        min: 0,
        max: 1,
        options: [],
        list_id: list.id,
        link_id: crypto.randomUUID(),
      },
    ]);
    setListId("");
  }

  return (
    <fieldset className="food-options" disabled={busy}>
      <legend>Personalización de la comida</legend>
      <p>
        Asigná una lista compartida o agregá sabores y extras exclusivos de esta
        comida.
      </p>
      <div className="food-options__actions">
        <select
          aria-label="Lista compartida"
          value={selectedList?.id ?? ""}
          disabled={isPending || !availableLists.length}
          onChange={(event) => setListId(event.target.value)}
        >
          <option value="">
            {isPending ? "Cargando listas…" : "Elegí una lista compartida"}
          </option>
          {availableLists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          data-action-tone="add"
          disabled={!selectedList || groups.length >= 12}
          onClick={() => selectedList && assignList(selectedList)}
        >
          Asignar lista
        </button>
        <button
          type="button"
          data-action-tone="add"
          disabled={groups.length >= 12}
          onClick={() =>
            setGroups([
              ...groups,
              {
                name: "",
                min: 0,
                max: 1,
                options: [],
              },
            ])
          }
        >
          Agregar grupo propio
        </button>
      </div>
      {isError && (
        <p role="alert">
          No se pudieron cargar las listas.{" "}
          <button
            type="button"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {isFetching && (
              <Loader2 size={16} className="btn-spinner" aria-hidden="true" />
            )}{" "}
            {isFetching ? "Cargando…" : "Reintentar"}
          </button>
        </p>
      )}
      {!isPending && !isError && !lists.length && (
        <p>
          Creá listas reutilizables desde «Listas compartidas» en Productos.
        </p>
      )}
      {groups.map((group, index) => (
        <fieldset key={group.link_id ?? index} className="food-options__group">
          <legend>{group.list_id ? "Lista compartida" : "Grupo propio"}</legend>
          <label>
            Nombre{" "}
            <input
              value={group.name}
              onChange={(e) =>
                update(index, { ...group, name: e.target.value })
              }
            />
          </label>
          <label>
            Mínimo Permitido{" "}
            <input
              type="number"
              min={0}
              value={group.min}
              onChange={(e) =>
                update(index, { ...group, min: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Máximo Permitido{" "}
            <input
              type="number"
              min={1}
              value={group.max}
              onChange={(e) =>
                update(index, { ...group, max: Number(e.target.value) })
              }
            />
          </label>
          {group.list_id &&
            lists
              .find((list) => list.id === group.list_id)
              ?.options.map((option) => {
                const override = group.options.find(
                  (entry) => entry.id === option.id,
                );
                return (
                  <label key={option.id}>
                    {option.name} · Recargo en este plato
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={override?.price ?? ""}
                      placeholder={String(option.price)}
                      onChange={(event) => {
                        const value = event.target.value;
                        const rest = group.options.filter(
                          (entry) => entry.id !== option.id,
                        );
                        update(index, {
                          ...group,
                          options:
                            value === ""
                              ? rest
                              : [
                                  ...rest,
                                  {
                                    ...option,
                                    enabled: true,
                                    price: Number(value),
                                  },
                                ],
                        });
                      }}
                    />
                  </label>
                );
              })}
          {!group.list_id &&
            group.options.map((option, optionIndex) => {
              const change = (values: Partial<typeof option>) =>
                update(index, {
                  ...group,
                  options: group.options.map((entry, position) =>
                    position === optionIndex ? { ...entry, ...values } : entry,
                  ),
                });
              return (
                <div key={option.id}>
                  <label>
                    Opción{" "}
                    <input
                      value={option.name}
                      onChange={(e) => change({ name: e.target.value })}
                    />
                  </label>
                  <label>
                    Recargo{" "}
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={option.price}
                      onChange={(e) =>
                        change({ price: Number(e.target.value) })
                      }
                    />
                  </label>
                  <span role="status">
                    {option.enabled ? "Disponible" : "Agotada"}
                  </span>
                  <button
                    type="button"
                    onClick={() => change({ enabled: !option.enabled })}
                  >
                    {option.enabled
                      ? "Marcar como agotada"
                      : "Volver a habilitar"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      update(index, {
                        ...group,
                        options: group.options.filter(
                          (entry) => entry.id !== option.id,
                        ),
                      })
                    }
                  >
                    Quitar opción
                  </button>
                </div>
              );
            })}
          {!group.list_id && (
            <button
              type="button"
              data-action-tone="add"
              disabled={group.options.length >= 50}
              onClick={() =>
                update(index, {
                  ...group,
                  options: [
                    ...group.options,
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
          )}
          <button
            type="button"
            onClick={() =>
              setGroups(groups.filter((_, position) => position !== index))
            }
          >
            Quitar grupo
          </button>
        </fieldset>
      ))}
    </fieldset>
  );
}
