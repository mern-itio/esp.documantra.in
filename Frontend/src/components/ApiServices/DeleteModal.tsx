import { useState } from "react";
import Modal from "../common/types/Modal";

export default function ProjectCard({}) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  return (
    <div>
      {/* Delete confirm modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Project"
        disableBackdropClose={true}
      >
        <div className="mb-6">
          <p className="text-base text-gray-700">
            {/* Are you sure you want to delete the project <b>{project.name}</b>? */}
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => setDeleteModalOpen(false)}
            className="border px-4 py-1.5 rounded-md cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            className="bg-red-600 text-white px-4 py-1.5 rounded-md font-semibold hover:bg-red-700 cursor-pointer"
            onClick={() => {
              setDeleteModalOpen(false);
            }}
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
