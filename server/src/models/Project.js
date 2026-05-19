import mongoose from 'mongoose';
import { PROJECT_STATUS } from '../utils/constants.js';

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Judul proyek wajib diisi'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Deskripsi proyek wajib diisi'],
      maxlength: 2000,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    assistants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    maxMembers: {
      type: Number,
      required: [true, 'Jumlah maksimum anggota wajib diisi'],
      min: [2, 'Minimal 2 anggota (termasuk ketua)'],
    },
    status: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      default: PROJECT_STATUS.OPEN,
    },
    startDate: {
      type: Date,
      required: [true, 'Tanggal mulai wajib diisi'],
    },
    endDate: {
      type: Date,
      required: [true, 'Tanggal selesai wajib diisi'],
    },
  },
  { timestamps: true }
);

projectSchema.index({ owner: 1 });
projectSchema.index({ claimedBy: 1 });
projectSchema.index({ members: 1 });
projectSchema.index({ assistants: 1 });
projectSchema.index({ status: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
