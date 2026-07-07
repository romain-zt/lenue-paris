import { CustomLivePreview as CustomLivePreview_228d81dcdeb179be68f94fc47adaec40 } from '@/components/admin/CustomLivePreview'
import { AIPanel as AIPanel_396e8f4aaff897ee309278257d9cf3b3 } from '@/components/admin/AIPanel'
import { S3ClientUploadHandler as S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24 } from '@payloadcms/storage-s3/client'
import { CollectionCards as CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1 } from '@payloadcms/next/rsc'

/** @type import('payload').ImportMap */
export const importMap = {
  "@/components/admin/CustomLivePreview#CustomLivePreview": CustomLivePreview_228d81dcdeb179be68f94fc47adaec40,
  "@/components/admin/AIPanel#AIPanel": AIPanel_396e8f4aaff897ee309278257d9cf3b3,
  "@payloadcms/storage-s3/client#S3ClientUploadHandler": S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24,
  "@payloadcms/next/rsc#CollectionCards": CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1
}
