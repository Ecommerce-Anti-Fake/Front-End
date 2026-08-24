import { CircleHelp } from "lucide-react";
import { Link } from "react-router-dom";
import "../../css/components/contextualHelp.css";

type Props = {
  to: string;
  children: React.ReactNode;
};

export default function ContextualHelpLink({ to, children }: Props) {
  return (
    <Link className="contextual-help-link" to={to}>
      <CircleHelp size={17} aria-hidden="true" />
      <span>{children}</span>
    </Link>
  );
}
