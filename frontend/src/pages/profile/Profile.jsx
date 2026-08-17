import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Pencil, User } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { Card, CardBody } from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { getProfile, updateProfile } from "../../api/profileApi.js";
import { extractErrorMessage } from "../../api/axiosClient.js";
import { useAuth } from "../../hooks/useAuth.js";
import { roleBadgeTone } from "../../utils/roles.js";

const schema = z.object({
  full_name: z
    .string()
    .min(1, "Full name is required")
    .min(2, "Full name must be at least 2 characters"),
});

export default function Profile() {
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({ queryKey: ["profile"], queryFn: getProfile });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "" },
  });

  useEffect(() => {
    if (profile) {
      reset({ full_name: profile.full_name || "" });
    }
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: (values) => updateProfile(values),
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile"], updated);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      refreshUser();
      toast.success("Profile updated");
      setIsEditing(false);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const handleCancel = () => {
    reset({ full_name: profile?.full_name || "" });
    setIsEditing(false);
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Profile"
        description="View and update your account information."
      />

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={refetch} />}

      {profile && (
        <Card>
          <CardBody>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-900 text-lg font-semibold text-white">
                {profile.full_name?.[0]?.toUpperCase() || (
                  <User className="h-6 w-6" />
                )}
              </div>
              <div>
                <p className="text-base font-semibold text-ink">
                  {profile.full_name}
                </p>
                <p className="text-sm text-ink-faint">{profile.email}</p>
                {profile.role?.name && (
                  <Badge
                    tone={roleBadgeTone[profile.role.name] || "neutral"}
                    className="mt-1.5"
                  >
                    {profile.role.name}
                  </Badge>
                )}
              </div>
            </div>

            {!isEditing ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-ink-faint">Full name</p>
                  <p className="mt-1 text-sm text-ink">{profile.full_name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-faint">Email</p>
                  <p className="mt-1 text-sm text-ink">{profile.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-faint">Role</p>
                  <p className="mt-1 text-sm text-ink">
                    {profile.role?.name || "\u2014"}
                  </p>
                  {profile.role?.description && (
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {profile.role.description}
                    </p>
                  )}
                </div>
                {typeof profile.is_active === "boolean" && (
                  <div>
                    <p className="text-xs font-medium text-ink-faint">
                      Account status
                    </p>
                    <Badge
                      tone={profile.is_active ? "brand" : "danger"}
                      className="mt-1"
                    >
                      {profile.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit profile
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit((values) => mutation.mutate(values))}
                className="space-y-4"
              >
                <Input
                  label="Full name"
                  autoFocus
                  error={errors.full_name?.message}
                  {...register("full_name")}
                />
                <Input
                  label="Email"
                  hint="Email cannot be changed"
                  value={profile.email}
                  disabled
                  readOnly
                />
                <Input
                  label="Role"
                  hint="Role cannot be changed here"
                  value={profile.role?.name || ""}
                  disabled
                  readOnly
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSubmitting || mutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={isSubmitting || mutation.isPending}
                  >
                    Save
                  </Button>
                </div>
              </form>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
