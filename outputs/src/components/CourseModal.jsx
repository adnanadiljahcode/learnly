import { CheckCircle2, Circle, X } from "lucide-react";
import { formatMinutes } from "../utils/formatMinutes";

export default function CourseModal({
  course,
  lessons,
  completedLessonIds,
  lessonBusy,
  onClose,
  onEnroll,
  onCompleteLesson,
}) {
  if (!course) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="course-modal" role="dialog" aria-modal="true" aria-labelledby="course-modal-title">
        <div className="modal-heading">
          <div>
            <div className="eyebrow">COURSE DETAILS</div>
            <h2 id="course-modal-title">{course.title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close course">
            <X size={19} />
          </button>
        </div>
        <p>{course.description || "Follow the lessons below and track your learning progress."}</p>
        {!course.enrolled && (
          <button className="continue-button" onClick={() => onEnroll(course)}>
            Enroll in course
          </button>
        )}
        <div className="lesson-list">
          {lessons.map((lesson) => {
            const done = completedLessonIds.includes(lesson.id);
            return (
              <article className="lesson-row" key={lesson.id}>
                <div className="lesson-status">
                  {done ? <CheckCircle2 size={19} /> : <Circle size={19} />}
                </div>
                <div className="lesson-copy">
                  <strong>{lesson.position}. {lesson.title}</strong>
                  <span>{formatMinutes(lesson.duration_minutes || 0)}</span>
                  {lesson.content && <p>{lesson.content}</p>}
                </div>
                {course.enrolled && (
                  <button
                    disabled={done || lessonBusy}
                    className="lesson-complete"
                    onClick={() => onCompleteLesson(lesson)}
                  >
                    {done ? "Completed" : lessonBusy ? "Saving…" : "Mark complete"}
                  </button>
                )}
              </article>
            );
          })}
          {lessons.length === 0 && (
            <p className="empty-copy">No lessons have been added to this course yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
