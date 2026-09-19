"use client"

import { useActionState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { AUTH } from "@/lib/constant"
import type { AuthFormState } from "@/lib/types"

interface AuthFormProps {
  title: string
  description?: string
  submitLabel: string
  /** Ask to repeat the password (first-run setup). */
  confirm?: boolean
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>
}

export function AuthForm({ title, description, submitLabel, confirm = false, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, { error: null })

  return (
    <Card className="w-full max-w-md">
      <form action={formAction}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={state.error ? true : undefined}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={confirm ? "new-password" : "current-password"}
                minLength={confirm ? AUTH.minPasswordLength : undefined}
                aria-invalid={state.error ? true : undefined}
                required
                autoFocus
              />
            </Field>
            {confirm ? (
              <Field>
                <FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
                <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
              </Field>
            ) : null}
            {state.error ? (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
          </FieldGroup>
        </CardContent>
        <CardFooter className="mt-6">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
