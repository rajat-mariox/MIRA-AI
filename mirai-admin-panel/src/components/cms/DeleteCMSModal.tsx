import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteCMSModalProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  title: string;
  isLoading: boolean;
}

const DeleteCMSModal: React.FC<DeleteCMSModalProps> = ({
  open,
  onClose,
  onDelete,
  title,
  isLoading,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 !mt-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">

      <div className="w-full max-w-md rounded-3xl bg-[#16181D] border border-white/10 overflow-hidden">

        <div className="flex justify-between items-center p-6 border-b border-white/10">

          <div className="flex items-center gap-3">

            <AlertTriangle className="text-red-500" />

            <h2 className="text-xl font-bold text-white">
              Delete CMS
            </h2>

          </div>

          <button onClick={onClose}>
            <X className="text-white/50" />
          </button>

        </div>

        <div className="p-6">

          <p className="text-white/70">

            Are you sure you want to delete

            <span className="font-bold text-white">

              {" "}{title}

            </span>

            ?

          </p>

        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-white/10">

          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-white/10 text-white"
          >
            Cancel
          </button>

          <button
            onClick={onDelete}
            disabled={isLoading}
            className="px-5 py-3 rounded-xl bg-red-500 text-white flex items-center gap-2"
          >
            <Trash2 size={18} />

            {isLoading ? "Deleting..." : "Delete"}

          </button>

        </div>

      </div>

    </div>
  );
};

export default DeleteCMSModal;