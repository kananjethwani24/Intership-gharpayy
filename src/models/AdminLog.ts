import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminLog extends Document {
  initiatorId: mongoose.Types.ObjectId;
  initiatorRole: string;
  action: string;
  targetId: mongoose.Types.ObjectId;
  targetModel: string;
  changes: any;
  createdAt: Date;
}

const AdminLogSchema: Schema = new Schema(
  {
    initiatorId: { type: Schema.Types.ObjectId, required: true },
    initiatorRole: { type: String, required: true },
    action: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    targetModel: { type: String, required: true },
    changes: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.AdminLog || mongoose.model<IAdminLog>('AdminLog', AdminLogSchema);
