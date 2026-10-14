import { Check, X } from "lucide-react";
export default function CorrectPopup({ correct = true }: { correct?: boolean }) {
  const Icon = correct ? Check : X;
  return (
    <div className={correct ? "correct-popup" : "wrong-popup"} role="status">
      <Icon size={24} strokeWidth={3} />
      <strong>{correct ? "Correct!" : "Incorrect"}</strong>
    </div>
  );
}
