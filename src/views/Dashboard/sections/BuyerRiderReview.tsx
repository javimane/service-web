"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { commerceService } from "@/services/commerceService";
import "./BuyerRiderReview.css";

export default function BuyerRiderReview({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { data: review, isLoading, isError } = useQuery({
    queryKey: ["buyer-rider-review", orderId],
    queryFn: () => commerceService.riderReview(orderId),
  });
  const submit = useMutation({
    mutationFn: () => commerceService.submitRiderReview(orderId, rating, comment),
    onSuccess: (saved) => {
      queryClient.setQueryData(["buyer-rider-review", orderId], saved);
    },
  });

  return (
    <section className="buyer-rider-review" aria-label="Calificación del rider">
      <h5 className="buyer-rider-review__title">Calificá al rider</h5>
      {isLoading ? <p>Cargando calificación…</p> : isError ? (
        <p role="alert">No se pudo consultar tu calificación. Actualizá la página para intentar de nuevo.</p>
      ) : review ? (
        <div className="buyer-rider-review__saved">
          <p>Tu calificación: {review.rating} de 5 estrellas</p>
          {review.comment && <p>{review.comment}</p>}
          <small>Gracias por compartir tu experiencia. Esta calificación ya fue enviada.</small>
        </div>
      ) : (
        <form onSubmit={(event) => { event.preventDefault(); if (rating) submit.mutate(); }}>
          <div className="buyer-rider-review__stars" role="group" aria-label="Elegí de 1 a 5 estrellas">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className="buyer-rider-review__star"
                aria-label={`${value} ${value === 1 ? "estrella" : "estrellas"}`}
                aria-pressed={rating === value}
                onClick={() => setRating(value)}
              >
                <Star size={22} fill={value <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <label className="buyer-rider-review__label" htmlFor={`rider-comment-${orderId}`}>Comentario (opcional)</label>
          <textarea
            id={`rider-comment-${orderId}`}
            value={comment}
            maxLength={1000}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Contanos cómo fue la entrega"
          />
          {submit.isError && <p role="alert">No se pudo guardar. Revisá si ya calificaste este envío e intentá actualizar.</p>}
          <button type="submit" className="buyer-rider-review__submit" disabled={!rating || submit.isPending}>
            {submit.isPending ? "Enviando…" : "Enviar calificación"}
          </button>
        </form>
      )}
    </section>
  );
}
