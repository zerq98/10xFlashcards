import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTopicsStore } from "../../store/useTopicsStore";
import { useToast } from "../../hooks/useToast";
import type { TopicDTO, CreateTopicRequestDTO } from "../../types";

interface NewTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (topic: TopicDTO) => void;
}

export const NewTopicModal = ({
  isOpen,
  onClose,
  onCreated,
}: NewTopicModalProps) => {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Nazwa tematu nie może być pusta");
      return;
    }

    if (name.length > 255) {
      setError("Nazwa tematu nie może przekraczać 255 znaków");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreateTopicRequestDTO = { name: name.trim() };
      const promise = fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (response) => {
        if (!response.ok) {
          if (response.status === 409) {
            setError("Temat o tej nazwie już istnieje");
            setIsSubmitting(false);
            throw new Error("Temat o tej nazwie już istnieje");
          }
          throw new Error("Failed to create topic");
        }

        const { data } = await response.json();
        return data;
      });

      // Show toast with loading state
      toast.promise(promise, {
        loading: "Tworzenie tematu...",
        success: () => `Temat "${name}" utworzony pomyślnie`,
        error: (err) =>
          `Błąd: ${err.message || "Nie udało się utworzyć tematu"}`,
      });

      const data = await promise;
      onCreated(data);
    } catch (error: unknown) {
      console.error("Error creating topic:", error);
      // Type guard for error objects with a message property
      if (error instanceof Error) {
        if (!error.message.includes("Temat o tej nazwie już istnieje")) {
          setError("Wystąpił błąd podczas tworzenia tematu. Spróbuj ponownie.");
          setIsSubmitting(false);
        }
      } else {
        setError(
          "Wystąpił nieznany błąd podczas tworzenia tematu. Spróbuj ponownie."
        );
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-0 bg-gray-900 m-0">
        <DialogHeader>
          <DialogTitle>Nowy Temat</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {" "}
          <div className="mb-4 space-y-2">
            <label htmlFor="topic-name" className="block text-sm font-medium">
              Nazwa tematu
            </label>
            <div
              className={`group ${
                error
                  ? "bg-red-500"
                  : "focus-within:bg-gradient-to-r focus-within:from-primary focus-within:via-secondary focus-within:to-accent bg-transparent"
              } p-[2px] rounded-md transition-all duration-300`}
            >
              <input
                id="topic-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 rounded-md focus:outline-none text-text"
                placeholder="Wpisz nazwę tematu..."
                disabled={isSubmitting}
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "topic-name-error" : undefined}
              />
            </div>
            {error && (
              <p id="topic-name-error" className="text-red-400 text-xs mt-1">
                {error}
              </p>
            )}
          </div>{" "}
          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-700 px-4 py-2 text-text hover:bg-gray-600 disabled:opacity-50 cursor-pointer transition-all duration-200"
              disabled={isSubmitting}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="py-2 px-4 rounded-md font-medium transition-all bg-primary-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 text-white shadow-md cursor-pointer disabled:cursor-none"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Tworzenie..." : "Utwórz temat"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
