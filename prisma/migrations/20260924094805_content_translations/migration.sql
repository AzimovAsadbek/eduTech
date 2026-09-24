-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "CourseCategory" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "Faq" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "MediaProject" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN     "translations" JSONB;
