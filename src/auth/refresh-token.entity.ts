import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Index,
  DefaultScope,
} from 'sequelize-typescript';
import { User } from '../user/user.entity';

@DefaultScope(() => ({
  attributes: { exclude: ['tokenHash'] },
}))
@Table({ tableName: 'refresh_tokens', timestamps: true })
export class RefreshToken extends Model<RefreshToken> {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @Index('idx_token_hash')
  @Column({ type: DataType.STRING, allowNull: false })
  tokenHash: string;

  @Column({ type: DataType.DATE, allowNull: false })
  expiresAt: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  revokedAt: Date | null;

  @Column({ type: DataType.STRING, allowNull: true })
  replacedByTokenHash: string | null;

  isExpired(reference: Date = new Date()): boolean {
    return this.expiresAt.getTime() <= reference.getTime();
  }

  isActive(reference: Date = new Date()): boolean {
    return !this.revokedAt && !this.isExpired(reference);
  }
}
